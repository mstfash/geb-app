import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import ReactTooltip from 'react-tooltip';
import { useStoreActions, useStoreState } from '../store';
import StepsContent from './StepsContent';
import { useActiveWeb3React } from '../hooks';
import { geb } from '../connectors';
import {
  handleTransactionError,
  useTransactionAdder,
} from '../hooks/TransactionHooks';
import { timeout } from '../utils/helper';
import { useTranslation } from 'react-i18next';
import { TICKER_NAME } from '../utils/constants';

const Steps = () => {
  const { t } = useTranslation();
  const { account, library, chainId } = useActiveWeb3React();
  const [blocksSinceCheck, setBlocksSinceCheck] = useState<number>();
  const {
    connectWalletModel: connectWalletState,
    transactionsModel: transactionsState,
  } = useStoreState((state) => state);
  const {
    popupsModel: popupsActions,
    connectWalletModel: connectWalletActions,
  } = useStoreActions((state) => state);

  const addTransaction = useTransactionAdder();

  const {
    step,
    isWrongNetwork,
    isStepLoading,
    blockNumber,
    ctHash,
  } = connectWalletState;

  const { transactions } = transactionsState;

  const returnConfirmations = async () => {
    if (
      !chainId ||
      !blockNumber[chainId] ||
      !ctHash ||
      !transactions[ctHash] ||
      step !== 1
    ) {
      return null;
    }
    connectWalletActions.setIsStepLoading(true);
    const currentBlockNumber = blockNumber[chainId];
    const txBlockNumber = transactions[ctHash].originalTx.blockNumber;
    if (!txBlockNumber || !currentBlockNumber) return null;
    const diff = currentBlockNumber - txBlockNumber;
    setBlocksSinceCheck(diff >= 10 ? 10 : diff);
    if (diff > 10) {
      await timeout(3000);
      connectWalletActions.setIsStepLoading(false);
      connectWalletActions.setStep(2);
      localStorage.removeItem('ctHash');
      return null;
    }
  };

  const returnConfCallback = useCallback(returnConfirmations, [
    chainId,
    blockNumber,
    ctHash,
    step,
  ]);

  useEffect(() => {
    returnConfCallback();
  }, [returnConfCallback]);

  const handleConnectWallet = () =>
    popupsActions.setIsConnectorsWalletOpen(true);

  const handleCreateAccount = async () => {
    if (!account || !library || !chainId) return false;
    const txData = geb.deployProxy();
    const signer = library.getSigner(account);

    try {
      connectWalletActions.setIsStepLoading(true);
      popupsActions.setIsWaitingModalOpen(true);
      popupsActions.setWaitingPayload({
        title: 'Waiting For Confirmation',
        text: `Creating new account`,
        hint: 'Confirm this transaction in your wallet',
        status: 'loading',
      });
      const txResponse = await signer.sendTransaction(txData);
      connectWalletActions.setCtHash(txResponse.hash);
      addTransaction(
        { ...txResponse, blockNumber: blockNumber[chainId] },
        'Creating an account'
      );
      popupsActions.setWaitingPayload({
        title: 'Transaction Submitted',
        hash: txResponse.hash,
        status: 'success',
      });
      await txResponse.wait();
    } catch (e) {
      connectWalletActions.setIsStepLoading(false);
      handleTransactionError(e);
    }
  };

  const handleCreateSafe = () => {
    popupsActions.setSafeOperationPayload({
      isOpen: true,
      type: 'deposit_borrow',
      isCreate: true,
    });
  };

  const returnSteps = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return (
          <StepsContent
            title={'getting_started'}
            text={'getting_started_text'}
            btnText={'connect_wallet'}
            handleClick={handleConnectWallet}
            isDisabled={isWrongNetwork}
            isLoading={isStepLoading}
          />
        );
      case 1:
        return (
          <StepsContent
            title={'create_account'}
            text={'create_account_text'}
            btnText={'create_account'}
            handleClick={handleCreateAccount}
            isDisabled={isWrongNetwork}
            isLoading={isStepLoading}
          />
        );
      case 2:
        return (
          <StepsContent
            title={'create_safe'}
            text={t('create_safe_text', { ticker_name: TICKER_NAME })}
            btnText={'create_safe'}
            handleClick={handleCreateSafe}
            isDisabled={isWrongNetwork}
            isLoading={isStepLoading}
          />
        );
      default:
        break;
    }
  };

  return (
    <StepsContainer>
      <StepsBars>
        {step !== 0 ? (
          <>
            <StepBar className={step !== 0 ? 'active' : ''} />
            <StepBar className={step === 2 ? 'active' : ''} />
          </>
        ) : null}
      </StepsBars>
      {returnSteps(step)}
      {step === 1 && ctHash ? (
        <>
          <Confirmations>
            {`WATITING FOR CONFIRMATIONS... ${
              !blocksSinceCheck
                ? 0
                : blocksSinceCheck > 10
                ? 10
                : blocksSinceCheck
            } of 10`}{' '}
            <InfoBtn data-tip={t('confirmations_info')}>?</InfoBtn>
          </Confirmations>
          <ReactTooltip multiline type="light" data-effect="solid" />
        </>
      ) : (
        ''
      )}
    </StepsContainer>
  );
};

export default Steps;

const StepsContainer = styled.div`
  margin-top: 20px;
  .__react_component_tooltip {
    max-width: 250px;
    padding-top: 20px;
    padding-bottom: 20px;
    border-radius: 5px;
    opacity: 1 !important;
    background: ${(props) => props.theme.colors.neutral};
    border: ${(props) => props.theme.colors.border};
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.16);
  }
`;

const StepsBars = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StepBar = styled.div`
  width: 68px;
  height: 4px;
  border-radius: 10px;
  background: ${(props) => props.theme.colors.placeholder};
  &.active {
    background: ${(props) => props.theme.colors.gradient};
  }
  margin-right: 8px;
  &:last-child {
    margin-right: 0;
  }
`;

const Confirmations = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-top: 10px;
  font-size: ${(props) => props.theme.font.extraSmall};
  font-weight: 600;
  color: ${(props) => props.theme.colors.secondary};
`;

const InfoBtn = styled.div`
  cursor: pointer;
  background: ${(props) => props.theme.colors.secondary};
  color: ${(props) => props.theme.colors.neutral};
  width: 15px;
  height: 15px;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 7px;
`;
