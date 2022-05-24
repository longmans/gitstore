import React, { useEffect } from "react";
import styles from "../styles/WalletSelectButton.module.css";

const NONE = "None";
const AR_CONNECT = "ArConnect";
const ARWEAVE_APP = "ArweaveApp";


export const WalletSelectButton = (props) => {
  const [showModal, setShowModal] = React.useState(false);
  const [activeWallet, setActiveWalelt] = React.useState(NONE);
  const [addressText, setAddressText] = React.useState("xxxxx...xxx");

  async function onWalletSelected(walletName) {
    let address = await window.arweaveWallet.getActiveAddress();
    if (address) {
      const firstFive = address.substring(0, 5);
      const lastFour = address.substring(address.length - 4);
      setAddressText(`${firstFive}..${lastFour}`);
      props.onWalletConnect();
    }
    setActiveWalelt(walletName);
  }

  return (
    <>
      <WalletButton
        onClick={() => setShowModal(true)}
        walletName={activeWallet}
        walletAddress={addressText}
      />
      {showModal && (
        <WalletModal
          onClose={() => setShowModal(false)}
          onConnected={(walletName) => onWalletSelected(walletName)}
        />
      )}
    </>
  );
};

const WalletButton = (props) => {
  switch (props.walletName) {
    case AR_CONNECT:
      return (
        <div className={styles.walletButton}>
          <img src="ArConnect_Logo.png" alt="wallet icon" />
          <p>{props.walletAddress}</p>
        </div>
      );
    case ARWEAVE_APP:
      return (
        <div className={styles.walletButton}>
          <img src="ArweaveApp_Logo.svg" alt="wallet icon" />
          <p>{props.walletAddress}</p>
        </div>
      );
    default:
      return (
        <div className={styles.walletButton} onClick={props.onClick}>
          Select Wallet
        </div>
      );
  }
};

const WalletModal = (props) => {
  async function connectWallet(walletName) {
    switch (walletName) {
      case AR_CONNECT:
        await window.arweaveWallet.connect(['ACCESS_ADDRESS','SIGN_TRANSACTION']);
        break;
      case ARWEAVE_APP:
        break;
      default:
        throw new Error(`Attempted to connect unknown wallet ${walletName}`);
    }
    props.onConnected(walletName);
    props.onClose();
  }

  return (
    <div className={styles.modal}>
      <div className={styles.scrim} onClick={() => props.onClose()} />
      <div className={styles.container}>
        <div className={styles.popup}>
          <h1 className={styles.title}>Connect Wallet</h1>
          <button className={styles.closeButton} onClick={() => props.onClose()}>
            <svg width="14" height="14">
              <path d="M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z"></path>
            </svg>
          </button>
          <div className={styles.buttonList}>
            <button
              className={styles.selectButton}
              onClick={() => connectWallet(AR_CONNECT)}
            >
              <p>ArConnect</p>
              <img src="ArConnect_Logo.png" alt="ArConnect icon" />
            </button>
            <button
              className={styles.selectButton}
              onClick={() => connectWallet(ARWEAVE_APP)}
            >
              <p>Arweave.app</p>
              <img src="ArweaveApp_Logo.svg" alt="ArweaveApp icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
