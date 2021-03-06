import Layout from '../components/layout'
import styles from '../styles/New.module.css'
import TextField from '@mui/material/TextField'
import { BsUpload } from 'react-icons/bs'
import Button from '@mui/material/Button'
import { WalletSelectButton } from '../components/WalletSelectButton'
import React, { useState, useEffect } from 'react'
import Arweave from "arweave"
import Alert from '@mui/material/Alert'
import { readContract } from 'smartweave'
import { selectWeightedPstHolder } from 'smartweave'


const initProductOptions = {
  host: "arweave.net", // Hostname or IP address for a Arweave host
  port: 443, // Port
  protocol: "https", // Network protocol http or https
  timeout: 50000, // Network request timeouts in milliseconds
  logging: false, // Enable network request logging
}

const initTestOptions = {
  host: 'testnet.redstone.tools',
  port: 443,
  protocol: 'https'
}


export default function New() {

  const arweave = Arweave.init(initProductOptions)
  const contractId = 'TcP64M-7DbsTFeI09OcHOW2SeUUGEtN1NydCcI-8AJY'
  //AR as fee
  const fee = 0.001

  const [isWalletConneted, setIsWalletConnected] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendFailureMsg, setSendFailureMsg] = useState("")
  const [repoName, setRepoName] = useState("")
  const [repoDesc, setRepoDesc] = useState("")
  const [selectedFile, setSelectedFile] = useState()
  const [isSelect, setIsSelected] = useState(false)
  const [isMissName, setMissName] = useState(false)
  const [isMissFile, setMissFile] = useState(false)
  const [isMissWallet, setMissWallet] = useState(false)

  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [pctComplete, setPctComplete] = useState(0)
  const [pstHolders, setPstHolders] = useState({})



  let inputRef = React.createRef()


  useEffect(() => {
    readContract(arweave, contractId).then(contractState => {
      // contractState is the latest state of the contract.
      // assuming it's a PST token, dump all the balances to the console:
      console.log("balances:", contractState.balances)
      const holders = selectWeightedPstHolder(contractState.balances)
      setPstHolders(holders)
    })
    return () => {
    };
  }, []);



  const sendFee = async () => {
    //send fee to 
    setIsSending(true)
    setSendFailureMsg("")
    const tx = await arweave.createTransaction({ target: pstHolders, quantity: arweave.ar.arToWinston(fee) })
    await arweave.transactions.sign(tx)
    const response = await arweave.transactions.post(tx)
    setIsSending(false)
    if (response.status === 200 || response.status === 208) {
      console.log(`seed fee success: ${tx.id}`)
      return true
    } else {
      console.error(`seed fee failure: ${tx.id}`)
      setSendFailureMsg(`seed fee failure: ${tx.id}`)
      return false
    }
  }



  const changeHandler = (event) => {
    if (!event.target.files) {
      return
    }
    let file = event.target.files[0]
    setSelectedFile(file)
    setIsSelected(true)
    console.log("file:", file)
  }


  async function airdrop() {
    const address = await window.arweaveWallet.getActiveAddress();
    // 100 AR = 100000000000000 Winston
    const response = await arweave.api.get('mint/' + address + '/100000000000000');
    console.log(response);
  }

  async function getBalance() {
    const address = await window.arweaveWallet.getActiveAddress();
    const balance = await arweave.wallets.getBalance(address);
    const ar = arweave.ar.winstonToAr(balance);
    console.log(ar, 'AR');
  }

  const postFile = async (e) => {
    e.preventDefault()
    console.log("postFile")
    if (!isWalletConneted) {
      setMissWallet(true)
      return
    }
    setMissWallet(false)
    if (!repoName) {
      setMissName(true)
      return
    }
    setMissName(false)
    if (!selectedFile) {
      setMissFile(true)
      return
    }
    setMissFile(false)
    setUploadSuccess(false)

    //await airdrop()
    //await getBalance()


    setIsPosting(true);
    let isSuccess = await sendFee()
    if (!isSuccess){
      console.error("can't post file")
      setUploadSuccess(false)
      setIsPosting(false)
      return
    }

    let reader = new FileReader()
    reader.readAsText(selectedFile)
    reader.onload = async () => {
      console.log("data result:", reader.result)
      console.log("window.arweaveWallet:", window.arweaveWallet)

      let tx = await arweave.createTransaction({ data: reader.result })
      tx.addTag('App-Name', process.env.appName)
      tx.addTag('Content-Type', selectedFile.type)
      tx.addTag('Version', process.env.Version)
      tx.addTag('File-Name', selectedFile.name)
      tx.addTag('Repo-Name', repoName)
      tx.addTag('Repo-Desc', repoDesc)
      await arweave.transactions.sign(tx);
      const uploader = await arweave.transactions.getUploader(tx);
      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        setPctComplete(uploader.pctComplete)
        console.log(
          `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`
        );
      }

      console.log("url:", `${initProductOptions.protocol}://${initProductOptions.host}:${initProductOptions.port}/${tx.id}`)
      setUploadSuccess(true)
      setIsPosting(false)
    }
  }



  return (
    <main className={styles.main}>
      <div className={styles.wallet}>
        <span></span>
        <div>
          <WalletSelectButton onWalletConnect={() => setIsWalletConnected(true)} />
        </div>
      </div>
      <div className={styles.container}>

        <p>
          Create a new repository
        </p>
        <p className={styles.description}>
          A repository contains all project files, including the revision history.
        </p>
      </div>
      <div className={styles.columnfield}>
        <TextField
          required
          error={isMissName}
          id="outlined-required"
          label="Repository name"
          defaultValue=""
          onChange={(e) => setRepoName(e.target.value)}
          helperText="Repository name required"
        />

        <br />
        <TextField fullWidth
          id="outlined-optional"
          label="Description(optional)"
          defaultValue=""
          onChange={(e) => setRepoDesc(e.target.value)}
        />
      </div>
      <br />
      <div className={styles.rowfield}>
        <BsUpload size={30} onClick={() => inputRef.current.click()} />
        <input ref={inputRef} type="file" name="file" onChange={changeHandler} style={{ display: "none" }} />
        <div>&nbsp;&nbsp;</div>
        {isSelect && selectedFile && <span>{selectedFile.name}</span>}
      </div>
      <br />
      <div className={styles.columnfield}>
        <Button variant="contained" onClick={postFile}>Submit</Button>
      </div>
      {isSending && <p>Sending {fee}AR as fee...</p>}
      {!isSending && sendFailureMsg && <p>{sendFailureMsg}</p>}
      {isMissWallet && <Alert severity="warning">Please connect to wallet first.</Alert>}
      {isMissFile && <Alert severity="warning">Missing upload file.</Alert>}
      {!isSending && isPosting && <p>Uploading {pctComplete}%...</p>}
      {uploadSuccess && <Alert severity="success">Success</Alert>}
    </main>
  )
}


New.getLayout = function getLayout(page) {
  return (
    <Layout>
      {page}
    </Layout>
  )
}
