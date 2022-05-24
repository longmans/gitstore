import Layout from '../components/layout'
import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'
import Arweave from "arweave"
import Paper from '@mui/material/Paper'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'
import { GrAddCircle } from 'react-icons/gr'
import Router from 'next/router'

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


export default function Home() {
  const arweave = Arweave.init(initProductOptions)
  const [data, setData] = useState([])
  const [searchInput, setSearchInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)


  useEffect(() => {
    queryData()
  }, []);

  const queryData = async () => {
    let query = `
    {
      transactions(tags: [{
        name: "App-Name",
        values: ["${process.env.appName}"]
      }], sort: HEIGHT_DESC) 
      {
        edges {
          node {
            id
            tags{name, value}
            block{
              id, timestamp
            }
          }
    
        }
      }
    }
    `
    const results = await arweave.api.post("/graphql", { query })
    console.log("query result:", results)
    if (results.status >= 400) {
      console.error("query failure.")
      return
    }
    setData(results.data.data.transactions.edges)
    console.log(`data:`, results.data.data.transactions.edges)
  }


  const getTag = (result, name) => {
    let out = result.node.tags.filter((i) => i.name === name)
    if (out.length > 0) {
      return out[0].value
    } else {
      return ""
    }
  }

  const Search = async (e) => {
    e.preventDefault()
    if (!searchInput) {
      console.error("no search input")
      return
    }
    console.log(`search: ${searchInput}`)
    setData([])

    let batch = 100
    let cursor = ""
    let searchResult = []
    let count = 0
    setIsSearching(true)
    while (true) {
      let query = ""
      if (cursor === "") {
        query = `
    {
      transactions(first: ${batch}, tags: [{
        name: "App-Name",
        values: ["${process.env.appName}"]
      }]) 
      {
        edges {
          cursor
          node {
            id
            tags{name, value}
            block{
              id, timestamp
            }
          }
    
        }
      }
    }
    `
      } else {
        query = `
    {
      transactions(first: ${batch}, after: "${cursor}", tags: [{
        name: "App-Name",
        values: ["${process.env.appName}"]
      }]) 
      {
        edges {
          cursor
          node {
            id
            tags{name, value}
            block{
              id, timestamp
            }
          }
        }
      }
    }
    `
      }
      const results = await arweave.api.post("/graphql", { query })
      console.log("query result:", results)
      if (results.status >= 400) {
        console.error("query failure.")
        setIsSearching(false)
        return
      }
      count += 1
      console.log(`${count} data:`, results.data.data.transactions.edges)
      for (let i of results.data.data.transactions.edges) {
        for (let j of i.node.tags) {
          if (j.name !== "File-Name" && j.name !== "Repo-Name" && j.name !== "Repo-Desc") continue
          if (j.value && j.value.toLowerCase().includes(searchInput.toLowerCase())) {
            searchResult.push(i)
            break
          }
        }
        cursor = i.cursor
      }

      if (results.data.data.transactions.edges.length < batch) {
        break
      }
    }
    console.log("searchResult:", searchResult)
    setData(searchResult)
    setIsSearching(false)
  }


  return (
    <main className={styles.main}>

      <p className={styles.description}>
        GitStore, store & earn your code
      </p>

      <div className={styles.search}>
        <Paper
          component="form"
          sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Search repository"
            inputProps={{ 'aria-label': 'search repository' }}
            onChange={(e) => setSearchInput(e.target.value)}

          />
          <IconButton type="submit" sx={{ p: '10px' }} aria-label="search" onClick={Search}>
            <SearchIcon />
          </IconButton>

        </Paper>
      </div>

      <div className={styles.new}><GrAddCircle onClick={() => { Router.push("/new") }} /></div>
      <div className={styles.container}>

        {isSearching && <p className={styles.searching}>Searching...</p>}
        <div className={styles.grid}>
          {
            data.map((result, i) => getTag(result, "Repo-Name") &&
              <a key={i} href={`${initProductOptions.protocol}://${initProductOptions.host}:${initProductOptions.port}/${result.node.id}`} className={styles.card} rel="noreferrer" target="_blank" >
                <h2>{getTag(result, "Repo-Name")}({getTag(result, "File-Name")})&rarr;</h2>
                <p>{getTag(result, "Repo-Desc")} </p>
              </a>
            )
          }
        </div>
      </div>
    </main>
  )
}


Home.getLayout = function getLayout(page) {
  return (
    <Layout>
      {page}
    </Layout>
  )
}
