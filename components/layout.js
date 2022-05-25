import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/layout.module.css'


export default function Layout({ children }) {
    return (
        <>
            <Head>
                <title>Layouts Example</title>
            </Head>

            <main className={styles.main}>{children}</main>

            <footer className={styles.footer}>
                <a
                    href="https://github.com/longmans/gitstore"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Github
                </a>
            </footer>
        </>
    )
}
