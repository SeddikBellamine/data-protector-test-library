import { IExecPrivateDataProtector } from "private-data-protector-test";
import React, { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
function App() {
  const [nameValue, setnameValue] = useState("");
  const [dataValue, setdataValue] = useState("");
  const handleChangeNameValue = (event) => setnameValue(event.target.value);
  const handleChangeDataValue = (event) => setdataValue(event.target.value);

  try {
    if (window.ethereum) {
      async function requestEthereum() {
        try {
          await window.ethereum.request({
            method: "eth_requestAccounts",
          });
        } catch (error) {
          console.error(error);
        }
      }

      requestEthereum();

      window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x86",
            chainName: "iExec Sidechain",
            nativeCurrency: {
              name: "xRLC",
              symbol: "xRLC",
              decimals: 18,
            },
            rpcUrls: ["https://bellecour.iex.ec"],
            blockExplorerUrls: ["https://blockscout-bellecour.iex.ec"],
          },
        ],
      });
    }
  } catch (e) {}
  const web3Provider = window.ethereum;

  const notify = (message) =>
    toast(message, {
      position: "center",
      top: "50%",
      left: "50%",
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  const mounted = useRef(false);
  const abortRunningProccess = useRef();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // cancel creation process on unmount
      if (typeof abortRunningProccess.current === "function") {
        abortRunningProccess.current();
      }
    };
  }, []);

  const handleCreate = async () => {
    console.log(nameValue);
    const PrivateData = new IExecPrivateDataProtector(web3Provider, {
      ipfsGateway: "https://gateway.pinata.cloud",
      iexecOptions: {
        smsURL: "https://v7.sms.prod-tee-services.bellecour.iex.ec",
      },
    });
    notify("SDK instantiated");
    PrivateData.createCNFTwithObservable(dataValue, nameValue).subscribe({
      next: (data) => {
        if (mounted.current) {
          const { message } = data;
          switch (message) {
            case "ENCRYPTION_KEY_CREATED":
              break;
            case "FILE_ENCRYPTED":
              notify(
                "Encrypted Confidential NFT upload in progress Please wait while we take care of protecting your Confidential NFT",
              );
              break;
            case "ENCRYPTED_FILE_UPLOADED":
              const { multiaddr } = data;
              console.log(multiaddr);
              notify("file encrypted");
              break;
            case "CONFIDENTIAL_NFT_DEPLOYMENT_SIGN_TX_REQUEST":
              notify(
                "Confidential NFT creation in progress... A signature is required for an Ethereum transaction Please check your wallet",
              );
              break;
            case "CONFIDENTIAL_NFT_DEPLOYMENT_SUCCESS":
              notify("Success Confidential NFT deployment");
              break;
            case "PUSH_SECRET_TO_SMS_SIGN_REQUEST":
              notify(
                "Confidential NFT creation in progress... A signature is required to authenticate on the Secret Management Service.   Please check your wallet",
              );
              break;
            case "PUSH_SECRET_TO_SMS_SUCCESS":
              notify("Push secret to sms success");
              break;

            default:
          }
        }
      },
      error: (e) => {
        abortRunningProccess.current = undefined;
        if (mounted.current) {
          notify(e.message);
        }
      },
      complete: () => {
        console.log("complete");
        abortRunningProccess.current = undefined;
      },
    });
  };

  return (
    <div
      className="App"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "400px",
        gap: "20px",
      }}
    >
      <label>
        Confidential NFT Name:
        <input
          type="text"
          name="name"
          value={nameValue}
          onChange={handleChangeNameValue}
        />
      </label>
      <label>
        Confidential NFT data:
        <input
          type="text"
          name="name"
          value={dataValue}
          onChange={handleChangeDataValue}
        />
      </label>
      <button onClick={handleCreate}> Create CNFT</button>
      <ToastContainer
        position="center"
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;
