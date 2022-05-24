import Layout from '../components/layout'
import styles from '../styles/New.module.css'
import TextField from '@mui/material/TextField'
import { BsUpload } from 'react-icons/bs';
import Button from '@mui/material/Button';
import { WalletSelectButton } from '../components/WalletSelectButton'
import React, { useState } from 'react'
import Arweave from "arweave"


const initProductOptions = {
  host: "arweave.net", // Hostname or IP address for a Arweave host
  port: 443, // Port
  protocol: "https", // Network protocol http or https
  timeout: 20000, // Network request timeouts in milliseconds
  logging: false, // Enable network request logging
}

const initTestOptions = {
  host: 'testnet.redstone.tools',
  port: 443,
  protocol: 'https'
}


export default function New() {

  const arweave = Arweave.init(initTestOptions)

  const [isWalletConneted, setIsWalletConnected] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [repoName, setRepoName] = useState("")
  const [repoDesc, setRepoDesc] = useState("")
  const [selectedFile, setSelectedFile] = useState()
  const [isSelect, setIsSelected] = useState(true)
  let inputRef = React.createRef()

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

  const postFile = async () => {
    console.log("postFile")
    if (!setRepoName || !isSelect || !selectedFile) {
      console.log("some field is miss.")
      return
    }
    //await airdrop()
    //await getBalance()

    setIsPosting(true);
    let reader = new FileReader()
    reader.readAsText(selectedFile)
    reader.onload = async () => {
      console.log("data result:", reader.result)
      console.log("window.arweaveWallet:", window.arweaveWallet)

      let tx = await arweave.createTransaction({ data: reader.result })
      tx.addTag('App-Name', process.env.appName)
      tx.addTag('Content-Type', selectedFile.type)
      tx.addTag('Version', '1.0.0')
      tx.addTag('File-Name', selectedFile.name)
      tx.addTag('Repo-Name', repoName)
      tx.addTag('Repo-Desc', repoDesc)
      await arweave.transactions.sign(tx);
      const uploader = await arweave.transactions.getUploader(tx);
      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        console.log(
          `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`
        );
      }
      console.log("url", `${initTestOptions.protocol}://${initTestOptions.host}:${initTestOptions.port}/${tx.id}`)
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
          id="outlined-required"
          label="Repository name"
          defaultValue=""
          onChange={(e) => setRepoName(e.target.value)}
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
