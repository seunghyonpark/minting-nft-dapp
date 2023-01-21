import { useState, useEffect } from 'react';
import Image from "next/image";
import { nftContractAddress } from '../config.js';
import { ethers } from 'ethers';
import axios from 'axios';

import Loader from 'react-loader-spinner';


import NFT from '../utils/knft.json';

declare var window: any;



const mint = () => {
	const [mintedNFT, setMintedNFT] = useState<String>("");
	const [miningStatus, setMiningStatus] = useState(0);
	const [loadingState, setLoadingState] = useState(0);
	const [txError, setTxError] = useState<String>("");
	const [currentAccount, setCurrentAccount] = useState<String>("");
	const [correctNetwork, setCorrectNetwork] = useState(false);

	// Checks if wallet is connected
	const checkIfWalletIsConnected = async () => {
		
		const { ethereum } = window;

		if (ethereum) {
			console.log('Got the ethereum obejct: ', ethereum)
		} else {
			console.log('No Wallet found. Connect Wallet')
		}

		const accounts = await ethereum.request({ method: 'eth_accounts' })

		if (accounts.length !== 0) {
			console.log('Found authorized Account: ', accounts[0])
			setCurrentAccount(accounts[0])
		} else {
			console.log('No authorized account found')
		}
	}

	// Calls Metamask to connect wallet on clicking Connect Wallet button
	const connectWallet = async () => {
		try {

			

			const { ethereum } = window

			if (!ethereum) {
				console.log('Metamask not detected')
				return
			}
			let chainId = await ethereum.request({ method: 'eth_chainId'})
			console.log('Connected to chain:' + chainId)

			/*
			const rinkebyChainId = '0x4';
			if (chainId !== rinkebyChainId) {
				alert('You are not connected to the Rinkeby Testnet!')
				return
			}
			*/

			const mumbaiChainId = "0x13881";
			if (chainId !== mumbaiChainId) {
				alert('You are not connected to the Mumbai!')
				return
			}


			const accounts = await ethereum.request({ method: 'eth_requestAccounts' })

			console.log('Found account', accounts[0])
			setCurrentAccount(accounts[0])
		} catch (error) {
			console.log('Error connecting to metamask', error)
		}
	}

	// Checks if wallet is connected to the correct network
	const checkCorrectNetwork = async () => {
		const { ethereum } = window
		let chainId = await ethereum.request({ method: 'eth_chainId' })
		console.log('Connected to chain:' + chainId)

		/*
		const rinkebyChainId = '0x4'

		if (chainId !== rinkebyChainId) {
			setCorrectNetwork(false)
		} else {
			setCorrectNetwork(true)
		}
		*/

		const mumbaiChainId = "0x13881";

		if (chainId !== mumbaiChainId) {
			setCorrectNetwork(false)
		} else {
			setCorrectNetwork(true)
		}

	}

	useEffect(() => {
		checkIfWalletIsConnected()
		checkCorrectNetwork()
	}, [])

	// Creates transaction to mint NFT on clicking Mint Character button
	const mintCharacter = async () => {
		try {
			const { ethereum } = window

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const nftContract = new ethers.Contract(
					nftContractAddress,
					NFT.abi,
					signer
				);

				let nftTx = await nftContract.createknft()
				console.log('Mining....', nftTx.hash)
				setMiningStatus(0)

				let tx = await nftTx.wait()
				setLoadingState(1)
				console.log('Mined!', tx)
				let event = tx.events[0]
				let value = event.args[2]
				let tokenId = value.toNumber()

				console.log(
					////`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTx.hash}`

					`Mined, see transaction: https://mumbai.polygonscan.com/tx/${nftTx.hash}`
				)

				getMintedNFT(tokenId)
			} else {
				console.log("Ethereum object doesn't exist!")
			}
		} catch (error: any) {
			console.log('Error minting character', error)
			setTxError(error.message)
		}
	}

	// Gets the minted NFT data
	const getMintedNFT = async (tokenId: any) => {
		try {
			const { ethereum } = window

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				const nftContract = new ethers.Contract(
					nftContractAddress,
					NFT.abi,
					signer
				)

				let tokenUri = await nftContract.tokenURI(tokenId)
				let data = await axios.get(tokenUri)
				let meta = data.data

				setMiningStatus(1)
				setMintedNFT(meta.image)
			} else {
				console.log("Ethereum object doesn't exist!")
			}
		} catch (error: any) {
			console.log(error)
			setTxError(error.message)
		}
	}

	return (
		<div className='flex flex-col items-center pt-32 bg-[#f3f6f4] text-[#6a50aa] min-h-screen'>
			<div className='trasition hover:rotate-180 hover:scale-105 transition duration-500 ease-in-out'>
			</div>
			<h2 className='text-3xl font-bold mb-20 mt-12'>
				Mint your NFT!
			</h2>
			{currentAccount === '' ? (
				<button
				className='text-2xl font-bold py-3 px-12 bg-[#f1c232] rounded-lg mb-10 hover:scale-105 transition duration-500 ease-in-out'
				onClick={connectWallet}
				>
				Connect Wallet
				</button>
				) : correctNetwork ? (
				<button
				className='text-2xl font-bold py-3 px-12 bg-[#f1c232] rounded-lg mb-10 hover:scale-105 transition duration-500 ease-in-out'
				onClick={mintCharacter}
				>
				Mint Character
				</button>
				) : (
				<div className='flex flex-col justify-center items-center mb-20 font-bold text-2xl gap-y-3'>
				<div>----------------------------------------</div>
				<div>Please connect to the Rinkeby Testnet</div>
				<div>and reload the page</div>
				<div>----------------------------------------</div>
				</div>
			)}
			<div className='text-xl font-semibold mb-20 mt-4'>
				<a
					href={`https://testnet.rarible.com/collection/${nftContractAddress}`}
					target='_blank'
				>
					<span className='hover:underline hover:underline-offset-8 '>
						View Collection on Rarible
					</span>
				</a>
			</div>
			{loadingState === 0 ? (
				miningStatus === 0 ? (
					txError === null ? (
						<div className='flex flex-col justify-center items-center'>
							<div className='text-lg font-bold'>
								Processing your transaction
							</div>

						</div>
					) : (
						<div className='text-lg text-red-600 font-semibold'>{txError}</div>
					)
				) : (
					<div></div>
				)
			) : (
				<div className='flex flex-col justify-center items-center'>
					<div className='font-semibold text-lg text-center mb-4'>
						Your Eternal Domain Character
					</div>
					<Image
						src={String(mintedNFT)}
						alt=''
						className='h-60 w-60 rounded-lg shadow-2xl shadow-[#6FFFE9] hover:scale-105 transition duration-500 ease-in-out'
                        width={500}
                        height={500}					
					/>
				</div>
			)}
		</div>
	)
}

export default mint
