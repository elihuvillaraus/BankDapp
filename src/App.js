import { useState, useEffect } from "react";
import { ethers, utils } from "ethers";
import abi from "./contracts/Bank.json";

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isBankerOwner, setIsBankerOwner] = useState(false);
  const [inputValue, setInputValue] = useState({
    withdraw: "",
    deposit: "",
    bankName: "",
  });
  const [bankOwnerAddress, setBankOwnerAddress] = useState(null);
  const [customerTotalBalance, setCustomerTotalBalance] = useState(null);
  const [currentBankName, setCurrentBankName] = useState(null);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [error, setError] = useState(null);

  const contractAddress = `0xd0b16c4c28ed582815c1b596057149da3b7f0e7b`;
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];
        setIsWalletConnected(true);
        setCustomerAddress(account);
        console.log("Cuenta conectada: ", account);
      } else {
        setError(
          "Por favor instala tu wallet de MetaMask para usar nuestro banco."
        );
        console.log("No Metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getBankName = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner(); // "Signer" es una abreviatura de la wallet de Metamask
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let bankName = await bankContract.bankName();
        bankName = utils.parseBytes32String(bankName);
        setCurrentBankName(bankName.toString());
      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const setBankNameHandler = async (event) => {
    event.preventDefault(); // Hace que no se recargue la página con los valores default
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const txn = await bankContract.setBankName(
          utils.formatBytes32String(inputValue.bankName)
        );
        console.log("Setting Bank Name...");
        await txn.wait();
        console.log("Bank Name Changed", txn.hash);
        await getBankName();
      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getbankOwnerHandler = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let owner = await bankContract.bankOwner();
        setBankOwnerAddress(owner);
        const [account] = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (owner.toLowerCase() === account.toLowerCase()) {
          setIsBankerOwner(true);
        }
      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const customerBalanceHandler = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let balance = await bankContract.getCustomerBalance();
        setCustomerTotalBalance(utils.formatEther(balance)); // Se formatea el número a Ether con esta sentencia de "utils.formatEther"
        console.log("Retrieved balance...", balance);
      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deposityMoneyHandler = async (event) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const txn = await bankContract.depositMoney({
          value: ethers.utils.parseEther(inputValue.deposit), //Esto utils.parseEther convierte Eth de vuelta a wei porque así está el smart contract.
        });
        console.log("Deposting money...");
        await txn.wait();
        console.log("Deposited money...done", txn.hash);

        customerBalanceHandler();
      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const withDrawMoneyHandler = async (event) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let myAddress = await signer.getAddress();
        console.log("provider signer...", myAddress);

        const txn = await bankContract.withdrawMoney(
          myAddress,
          ethers.utils.parseEther(inputValue.withdraw)
        );
        console.log("Withdrawing money...");
        await txn.wait();
        console.log("Money with drew...done", txn.hash);

        customerBalanceHandler();
      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleInputChange = (event) => {
    setInputValue((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    getBankName();
    getbankOwnerHandler();
    customerBalanceHandler();
  }, [isWalletConnected]);

  return (
    <main className="main-container">
      <h2 className="headline">
        <span className="headline-gradient">Banco del Etherstar</span> 🧓🏼 💰
      </h2>
      <section className="customer-section px-10 pt-5 pb-10">
        {error && <p className="text-2xl text-red-700">{error}</p>}
        <div className="mt-5">
          {currentBankName === "" && isBankerOwner ? (
            <p>"Establece el nombre de tu Banco." </p>
          ) : (
            <p className="text-3xl font-bold">{currentBankName}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-around items-center my-10 space-y-10 sm:space-y-0">
          <div className="">
            <form className="form-style">
              <input
                type="text"
                className="input-style"
                onChange={handleInputChange}
                name="deposit"
                placeholder="0.0000 ETH"
                value={inputValue.deposit}
              />
              <button className="btn-purple" onClick={deposityMoneyHandler}>
                Deposita dinero en Ethers
              </button>
            </form>
          </div>
          <div className="">
            <form className="form-style">
              <input
                type="text"
                className="input-style"
                onChange={handleInputChange}
                name="withdraw"
                placeholder="0.0000 ETH"
                value={inputValue.withdraw}
              />
              <button className="btn-blue" onClick={withDrawMoneyHandler}>
                Retira tu dinero en Ethers
              </button>
            </form>
          </div>
        </div>
        <div className="mt-5 bg-slate-200/90 rounded-lg p-2">
          <p>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-800">
              Tu Balance en ETH:{" "}
            </span>
            {customerTotalBalance}
          </p>
        </div>
        <div className="mt-5">
          <p>
            <span className="font-bold">Cuenta para depositar: </span>
            {bankOwnerAddress}
          </p>
        </div>
        <div className="mt-5">
          {isWalletConnected && (
            <p>
              <span className="font-bold">Tu cuenta: </span>
              {customerAddress}
            </p>
          )}
          <button className="btn-connect" onClick={checkIfWalletIsConnected}>
            {isWalletConnected ? "Wallet Conectada 🔒" : "Conectar Wallet 🔑"}
          </button>
        </div>
      </section>
      {isBankerOwner && (
        <section className="bank-owner-section">
          <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">
            Panel de Admin del Banco
          </h2>
          <div className="p-10">
            <form className="form-style">
              <input
                type="text"
                className="input-style"
                onChange={handleInputChange}
                name="bankName"
                placeholder="Enter a Name for Your Bank"
                value={inputValue.bankName}
              />
              <button className="btn-grey" onClick={setBankNameHandler}>
                Set Bank Name
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
export default App;
