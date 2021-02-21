import numeral from 'numeral'
import { action, Action, thunk, Thunk } from 'easy-peasy'
import { JsonRpcSigner } from '@ethersproject/providers/lib/json-rpc-provider'
import {
    ISafeData,
    ISafePayload,
    ILiquidationData,
    ISafe,
    ISafeHistory,
    IFetchSafesPayload,
    IFetchSafeById,
} from '../utils/interfaces'
import {
    handleCollectETH,
    handleDepositAndBorrow,
    handleRepayAndWithdraw,
} from '../services/blockchain'
import { fetchSafeById, fetchUserSafes } from '../services/graphql'
import { DEFAULT_SAFE_STATE } from '../utils/constants'
import { timeout } from '../utils/helper'
import { StoreModel } from '.'
import { NETWORK_ID } from '../connectors'

export interface SafeModel {
    list: Array<ISafe>
    safeCreated: boolean
    singleSafe: ISafe | null
    operation: number
    totalEth: string
    totalRAI: string
    isES: boolean
    isUniSwapPoolChecked: boolean
    stage: number
    isSuccessfulTx: boolean
    safeData: ISafeData
    liquidationData: ILiquidationData
    uniSwapPool: ISafeData
    historyList: Array<ISafeHistory>
    depositAndBorrow: Thunk<
        SafeModel,
        ISafePayload & { safeId?: string },
        any,
        StoreModel
    >
    repayAndWithdraw: Thunk<
        SafeModel,
        ISafePayload & { safeId: string },
        any,
        StoreModel
    >
    fetchSafeById: Thunk<SafeModel, IFetchSafeById, any, StoreModel>
    fetchUserSafes: Thunk<SafeModel, IFetchSafesPayload, any, StoreModel>
    collectETH: Thunk<
        SafeModel,
        { signer: JsonRpcSigner; safe: ISafe },
        any,
        StoreModel
    >
    setIsSafeCreated: Action<SafeModel, boolean>
    setList: Action<SafeModel, Array<ISafe>>
    setSingleSafe: Action<SafeModel, ISafe | null>
    setOperation: Action<SafeModel, number>
    setTotalEth: Action<SafeModel, string>
    setTotalRAI: Action<SafeModel, string>
    setIsES: Action<SafeModel, boolean>
    setLiquidationData: Action<SafeModel, ILiquidationData>
    setSafeData: Action<SafeModel, ISafeData>
    setUniSwapPool: Action<SafeModel, ISafeData>
    setIsUniSwapPoolChecked: Action<SafeModel, boolean>
    setStage: Action<SafeModel, number>
    setSafeHistoryList: Action<SafeModel, Array<ISafeHistory>>
    setIsSuccessfulTx: Action<SafeModel, boolean>
}

const safeModel: SafeModel = {
    list: [],
    safeCreated: false,
    operation: 0,
    singleSafe: null,
    totalEth: '0.00',
    totalRAI: '0.00',
    isSuccessfulTx: true,
    isES: true,
    isUniSwapPoolChecked: true,
    stage: 0,
    safeData: DEFAULT_SAFE_STATE,
    liquidationData: {
        accumulatedRate: '0',
        currentPrice: {
            liquidationPrice: '0',
            safetyPrice: '',
            value: '',
        },
        debtFloor: '0',
        debtCeiling: '0',
        globalDebt: '0',
        liquidationCRatio: '1', // Rate percentage
        liquidationPenalty: '1', // Rate percentage
        safetyCRatio: '0',
        currentRedemptionPrice: '0',
        totalAnnualizedStabilityFee: '0',
        currentRedemptionRate: '0',
        perSafeDebtCeiling: '0',
        globalDebtCeiling: '0',
    },
    uniSwapPool: DEFAULT_SAFE_STATE,
    historyList: [],
    depositAndBorrow: thunk(async (actions, payload, { getStoreActions }) => {
        const storeActions = getStoreActions()
        const txResponse = await handleDepositAndBorrow(
            payload.signer,
            payload.safeData,
            payload.safeId
        )
        if (txResponse) {
            const { hash, chainId } = txResponse
            storeActions.transactionsModel.addTransaction({
                chainId,
                hash,
                from: txResponse.from,
                summary: payload.safeId
                    ? 'Modifying Safe'
                    : 'Creating a new Safe',
                addedTime: new Date().getTime(),
                originalTx: txResponse,
            })
            storeActions.popupsModel.setIsWaitingModalOpen(true)
            if (!payload.safeId) {
                storeActions.popupsModel.setWaitingPayload({
                    title: 'Transaction Submitted',
                    text: 'Adding a new safe...',
                    status: 'success',
                    isCreate: true,
                })
            } else {
                storeActions.popupsModel.setWaitingPayload({
                    title: 'Transaction Submitted',
                    hash: txResponse.hash,
                    status: 'success',
                })
            }

            actions.setStage(0)
            actions.setUniSwapPool(DEFAULT_SAFE_STATE)
            actions.setSafeData(DEFAULT_SAFE_STATE)
            await txResponse.wait()
        } else {
            storeActions.connectWalletModel.setIsStepLoading(false)
            storeActions.connectWalletModel.setStep(2)
        }
    }),
    repayAndWithdraw: thunk(
        async (actions, payload, { getStoreActions, getStoreState }) => {
            const storeActions = getStoreActions()
            const txResponse = await handleRepayAndWithdraw(
                payload.signer,
                payload.safeData,
                payload.safeId
            )
            if (txResponse) {
                const { hash, chainId } = txResponse
                storeActions.transactionsModel.addTransaction({
                    chainId,
                    hash,
                    from: txResponse.from,
                    summary: 'Modifying Safe',
                    addedTime: new Date().getTime(),
                    originalTx: txResponse,
                })
                storeActions.popupsModel.setIsWaitingModalOpen(true)
                storeActions.popupsModel.setWaitingPayload({
                    title: 'Transaction Submitted',
                    hash: txResponse.hash,
                    status: 'success',
                })

                actions.setStage(0)
                actions.setUniSwapPool(DEFAULT_SAFE_STATE)
                actions.setSafeData(DEFAULT_SAFE_STATE)
                await txResponse.wait()
            }
        }
    ),
    collectETH: thunk(async (actions, payload, { getStoreActions }) => {
        const storeActions = getStoreActions()
        const txResponse = await handleCollectETH(payload.signer, payload.safe)
        if (txResponse) {
            const { hash, chainId } = txResponse
            storeActions.transactionsModel.addTransaction({
                chainId,
                hash,
                from: txResponse.from,
                summary: 'Collecting ETH',
                addedTime: new Date().getTime(),
                originalTx: txResponse,
            })
            storeActions.popupsModel.setIsWaitingModalOpen(true)
            storeActions.popupsModel.setWaitingPayload({
                title: 'Transaction Submitted',
                hash: txResponse.hash,
                status: 'success',
            })
            await txResponse.wait()
        }
    }),
    fetchUserSafes: thunk(
        async (actions, payload, { getStoreActions, getState }) => {
            const storeActions = getStoreActions()
            const state = getState()
            const { isSuccessfulTx } = state
            const fetched = await fetchUserSafes(payload)
            if (fetched) {
                actions.setList(fetched.userSafes)
                if (fetched.userSafes.length > 0) {
                    actions.setIsSafeCreated(true)
                    storeActions.connectWalletModel.setStep(2)
                } else if (!fetched.userSafes.length && !isSuccessfulTx) {
                    actions.setIsSafeCreated(false)
                    storeActions.connectWalletModel.setIsStepLoading(false)
                } else {
                    storeActions.popupsModel.setWaitingPayload({
                        title: 'Fetching user safes',
                        status: 'loading',
                    })
                    actions.setIsSafeCreated(false)
                }
                actions.setLiquidationData(fetched.liquidationData)
                const chainId = NETWORK_ID
                if (fetched.availableRAI && chainId) {
                    storeActions.connectWalletModel.updateRaiBalance({
                        chainId,
                        balance: numeral(fetched.availableRAI).value(),
                    })
                }
                await timeout(200)
                return fetched
            }
        }
    ),

    fetchSafeById: thunk(async (actions, payload, { getStoreActions }) => {
        const storeActions = getStoreActions()
        const res = await fetchSafeById(payload)
        if (res) {
            actions.setSingleSafe(res.safe[0])
            if (res.safeHistory.length > 0) {
                actions.setSafeHistoryList(res.safeHistory)
            }
            actions.setLiquidationData(res.liquidationData)
            storeActions.connectWalletModel.updateRaiBalance({
                chainId: NETWORK_ID,
                balance: numeral(res.erc20Balance).value(),
            })
            if (res.proxyData) {
                const { address, coinAllowance } = res.proxyData
                if (address) {
                    storeActions.connectWalletModel.setProxyAddress(address)
                }
                if (coinAllowance) {
                    storeActions.connectWalletModel.setCoinAllowance(
                        coinAllowance.amount
                    )
                } else {
                    storeActions.connectWalletModel.setCoinAllowance('')
                }
            }
        }
    }),

    setIsSafeCreated: action((state, payload) => {
        state.safeCreated = payload
    }),
    setList: action((state, payload) => {
        state.list = payload
    }),
    setSingleSafe: action((state, payload) => {
        state.singleSafe = payload
    }),
    setOperation: action((state, payload) => {
        state.operation = payload
    }),
    setTotalEth: action((state, payload) => {
        state.totalEth = payload
    }),
    setTotalRAI: action((state, payload) => {
        state.totalRAI = payload
    }),
    setIsES: action((state, payload) => {
        state.isES = payload
    }),

    setLiquidationData: action((state, payload) => {
        state.liquidationData = payload
    }),

    setSafeData: action((state, payload) => {
        state.safeData = payload
    }),
    setUniSwapPool: action((state, payload) => {
        state.uniSwapPool = payload
    }),
    setIsUniSwapPoolChecked: action((state, payload) => {
        state.isUniSwapPoolChecked = payload
    }),
    setStage: action((state, payload) => {
        state.stage = payload
    }),
    setSafeHistoryList: action((state, payload) => {
        state.historyList = payload
    }),
    setIsSuccessfulTx: action((state, payload) => {
        state.isSuccessfulTx = payload
    }),
}

export default safeModel
