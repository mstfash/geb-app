import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import _ from '../../utils/lodash'
import { useActiveWeb3React } from '../../hooks'
import {
    useChangeTargetedCRatio,
    useSaviourData,
    useSaviourDeposit,
    useSaviourWithdraw,
} from '../../hooks/useSaviour'
import { useStoreActions, useStoreState } from '../../store'
import { returnConnectorName } from '../../utils/helper'
import Button from '../Button'
import TransactionOverview from '../TransactionOverview'
import Results from './Results'
import { handleTransactionError } from '../../hooks/TransactionHooks'
import { useSafeHandler } from '../../hooks/useGeb'

const SaviourTransactions = () => {
    const { connector, account, library } = useActiveWeb3React()
    const { t } = useTranslation()
    const {
        safeModel: safeActions,
        popupsModel: popupsActions,
    } = useStoreActions((state) => state)

    const { safeModel: safeState } = useStoreState((state) => state)
    const {
        amount,
        targetedCRatio,
        isSaviourDeposit,
        isMaxWithdraw,
    } = safeState

    const saviourData = useSaviourData()

    const safeId = _.get(saviourData, 'safeId', '0')
    const safeHandler = useSafeHandler(safeId)

    const { depositCallback } = useSaviourDeposit()
    const { withdrawCallback } = useSaviourWithdraw()
    const { changeTargetedCRatio } = useChangeTargetedCRatio()

    const handleBack = () => safeActions.setOperation(0)

    const handleClose = () => {
        safeActions.setAmount('')
        safeActions.setOperation(0)
        safeActions.setTargetedCRatio(0)
        popupsActions.setIsSaviourModalOpen(false)
        safeActions.setIsMaxWithdraw(false)
        safeActions.setIsSaviourDeposit(true)
    }

    const handleConfirm = async () => {
        if (!account || !library || !saviourData) {
            console.debug('no account , library or saviourData')
            return
        }
        try {
            handleClose()
            popupsActions.setIsWaitingModalOpen(true)
            popupsActions.setWaitingPayload({
                title: 'Waiting For Confirmation',
                text: `Safe Saviour ${
                    isSaviourDeposit ? 'Deposit' : 'Withdraw'
                }`,
                hint: 'Confirm this transaction in your wallet',
                status: 'loading',
            })
            const signer = library.getSigner(account)
            const saviourPayload = {
                safeId: Number(safeId),
                safeHandler,
                amount,
                targetedCRatio,
                isTargetedCRatioChanged:
                    targetedCRatio !== saviourData.saviourRescueRatio,
            }
            if (
                saviourData.hasSaviour &&
                !amount &&
                targetedCRatio !== saviourData.saviourRescueRatio
            ) {
                await changeTargetedCRatio(signer, saviourPayload)
            } else if (isSaviourDeposit) {
                await depositCallback(signer, saviourPayload)
            } else {
                await withdrawCallback(signer, {
                    ...saviourPayload,
                    isMaxWithdraw,
                })
            }
        } catch (e) {
            handleTransactionError(e)
        }
    }
    return (
        <Container>
            <>
                <Body>
                    <TransactionOverview
                        title={t('confirm_transaction_details')}
                        description={
                            t('confirm_details_text') +
                            (returnConnectorName(connector)
                                ? 'on ' + returnConnectorName(connector)
                                : '')
                        }
                    />
                    <Results />
                </Body>

                <Footer>
                    <Button
                        dimmedWithArrow
                        text={t('back')}
                        onClick={handleBack}
                    />
                    <Button
                        withArrow
                        text={t('confirm_transaction')}
                        onClick={handleConfirm}
                    />
                </Footer>
            </>
        </Container>
    )
}

export default SaviourTransactions

const Container = styled.div``

const Body = styled.div`
    padding: 20px;
`

const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 20px;
`
