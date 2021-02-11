import { ChainId } from '@uniswap/sdk'
import { css } from 'styled-components'
import { injected, walletconnect, walletlink } from '../connectors'
import { WalletInfo } from './interfaces'

const {
    REACT_APP_GRAPH_API_URLS,
    REACT_APP_NETWORK_ID,
    REACT_APP_COIN_TICKER_PRODUCTION,
    REACT_APP_COIN_TICKER_KOVAN,
    REACT_APP_SYSTEM_STATUS,
    REACT_APP_MAILCHIMP_URL,
} = process.env

export enum Network {
    MAINNET = 'mainnet',
    KOVAN = 'kovan',
}

export const ETH_NETWORK =
    REACT_APP_NETWORK_ID === '1' ? Network.MAINNET : Network.KOVAN

export const COIN_TICKER =
    REACT_APP_NETWORK_ID === '1'
        ? REACT_APP_COIN_TICKER_PRODUCTION
        : REACT_APP_COIN_TICKER_KOVAN
        ? REACT_APP_COIN_TICKER_KOVAN
        : 'RAI'

export const COLLATERAL_TYPE_ID = 'ETH-A'

export const SYSTEM_STATUS = REACT_APP_SYSTEM_STATUS || ''

export const GRAPH_API_URLS = REACT_APP_GRAPH_API_URLS
    ? REACT_APP_GRAPH_API_URLS.split(',')
    : [
          'https://subgraph-kovan.reflexer.finance/subgraphs/name/reflexer-labs/rai',
      ]

export const MAILCHIMP_URL = REACT_APP_MAILCHIMP_URL

export const NetworkContextName = 'NETWORK'

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
    INJECTED: {
        connector: injected,
        name: 'Injected',
        iconName: 'arrow-right.svg',
        description: 'Injected web3 provider.',
        href: null,
        color: '#010101',
        primary: true,
    },
    METAMASK: {
        connector: injected,
        name: 'MetaMask',
        iconName: 'metamask.png',
        description: 'Easy-to-use browser extension.',
        href: null,
        color: '#E8831D',
    },
    WALLET_CONNECT: {
        connector: walletconnect,
        name: 'WalletConnect',
        iconName: 'walletConnectIcon.svg',
        description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
        href: null,
        color: '#4196FC',
        mobile: true,
    },
    WALLET_LINK: {
        connector: walletlink,
        name: 'Coinbase Wallet',
        iconName: 'coinbaseWalletIcon.svg',
        description: 'Use Coinbase Wallet app on mobile device',
        href: null,
        color: '#315CF5',
    },
    COINBASE_LINK: {
        name: 'Open in Coinbase Wallet',
        iconName: 'coinbaseWalletIcon.svg',
        description: 'Open in Coinbase Wallet app.',
        href: 'https://go.cb-w.com/mtUDhEZPy1',
        color: '#315CF5',
        mobile: true,
        mobileOnly: true,
    },
}

export const ETHERSCAN_PREFIXES: { [chainId in ChainId]: string } = {
    1: '',
    3: 'ropsten.',
    4: 'rinkeby.',
    5: 'goerli.',
    42: 'kovan.',
}

const MEDIA_WIDTHS = {
    upToExtraSmall: 576,
    upToSmall: 768,
    upToMedium: 992,
    upToLarge: 1280,
}

export const mediaWidthTemplates: {
    [width in keyof typeof MEDIA_WIDTHS]: typeof css
} = Object.keys(MEDIA_WIDTHS).reduce((accumulator, size) => {
    ;(accumulator as any)[size] = (a: any, b: any, c: any) => css`
        @media (max-width: ${(MEDIA_WIDTHS as any)[size]}px) {
            ${css(a, b, c)}
        }
    `
    return accumulator
}, {}) as any

export const DEFAULT_SAFE_STATE = {
    totalCollateral: '',
    totalDebt: '',
    leftInput: '',
    rightInput: '',
    collateralRatio: 0,
    liquidationPrice: 0,
}

export const floatsTypes = {
    WAD: 18,
    RAY: 27,
    RAD: 45,
}

export const jdenticonConfig = {
    hues: [103],
    lightness: {
        color: [0.84, 0.84],
        grayscale: [0.84, 0.84],
    },
    saturation: {
        color: 0.48,
        grayscale: 0.48,
    },
    backColor: '#50ccd5',
}

export const INITIAL_INCENTIVE_STATE = [
    {
        campaignNumber: '',
        periodFinish: '',
        campaignAddress: '',
        rewardRate: '',
        totalSupply: '',
        coinAddress: '',
        wethAddress: '',
        coinTotalSupply: '',
        stakedBalance: '',
        campaignEndTime: '',
        dailyFLX: 0,
        uniSwapLink: '',
        ethStake: '',
        raiStake: '',
        myRewardRate: '',
        reserveRAI: '',
        reserveETH: '',
        token0: '',
        token0Price: '',
        token1Price: '',
        lastUpdatedTime: '',
        rewardPerTokenStored: '',
        isOngoingCampaign: false,
        isCoinLessThanWeth: true,
        user: '' || null,
        IB_reward: '',
        IB_userRewardPerTokenPaid: '',
    },
]

const INIT_VALUES = {
    name: 'FLX',
    img: require('../assets/logo192.png'),
    amount: 0,
    price: 0,
    diff: 0,
    value: 0,
    diffPercentage: 0,
}

export const INITIAL_INCENTIVE_ASSETS_STATE = {
    eth: INIT_VALUES,
    rai: INIT_VALUES,
    flx: INIT_VALUES,
}
export const network_name =
    process.env.REACT_APP_NETWORK_ID === '1' ? 'mainnet' : 'kovan'
