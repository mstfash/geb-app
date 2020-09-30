import { AbstractConnector } from '@web3-react/abstract-connector';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import ReactGA from 'react-ga';
import styled from 'styled-components';
import { fortmatic, injected, portis } from '../../connectors';
import { OVERLAY_READY } from '../../connectors/Fortmatic';
import { SUPPORTED_WALLETS } from '../../utils/constants';
import usePrevious from '../../hooks/usePrevious';

import Modal from '../Modals/Modal';
import Option from './Option';
import PendingView from './PendingView';
import { useStoreActions, useStoreState } from '../../store';
import { useTranslation } from 'react-i18next';

const WALLET_VIEWS = {
  OPTIONS: 'options',
  OPTIONS_SECONDARY: 'options_secondary',
  ACCOUNT: 'account',
  PENDING: 'pending',
};

export default function WalletModal() {
  const { t } = useTranslation();
  const { popupsModel: popupsState } = useStoreState((state) => state);
  const { popupsModel: popupsActions } = useStoreActions((state) => state);
  const { isConnectorsWalletOpen } = popupsState;

  const { active, account, connector, activate, error } = useWeb3React();

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT);

  const [pendingWallet, setPendingWallet] = useState<
    AbstractConnector | undefined
  >();

  const [pendingError, setPendingError] = useState<boolean>();

  const previousAccount = usePrevious(account);

  const toggleWalletModal = () =>
    popupsActions.setIsConnectorsWalletOpen(!isConnectorsWalletOpen);

  // close on connection, when logged out before
  useEffect(() => {
    if (account && !previousAccount && isConnectorsWalletOpen) {
      toggleWalletModal();
    }
    // eslint-disable-next-line
  }, [account, previousAccount, isConnectorsWalletOpen]);

  // always reset to account view
  useEffect(() => {
    if (isConnectorsWalletOpen) {
      setPendingError(false);
      setWalletView(WALLET_VIEWS.ACCOUNT);
    }
  }, [isConnectorsWalletOpen]);

  // close modal when a connection is successful
  const activePrevious = usePrevious(active);
  const connectorPrevious = usePrevious(connector);
  useEffect(() => {
    if (
      isConnectorsWalletOpen &&
      ((active && !activePrevious) ||
        (connector && connector !== connectorPrevious && !error))
    ) {
      setWalletView(WALLET_VIEWS.ACCOUNT);
    }
  }, [
    setWalletView,
    active,
    error,
    connector,
    isConnectorsWalletOpen,
    activePrevious,
    connectorPrevious,
  ]);

  const tryActivation = async (connector: AbstractConnector | undefined) => {
    let name = '';
    Object.keys(SUPPORTED_WALLETS).map((key) => {
      if (connector === SUPPORTED_WALLETS[key].connector) {
        return (name = SUPPORTED_WALLETS[key].name);
      }
      return true;
    });
    // log selected wallet
    ReactGA.event({
      category: 'Wallet',
      action: 'Change Wallet',
      label: name,
    });
    setPendingWallet(connector); // set wallet for pending view
    setWalletView(WALLET_VIEWS.PENDING);

    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    if (
      connector instanceof WalletConnectConnector &&
      connector.walletConnectProvider?.wc?.uri
    ) {
      connector.walletConnectProvider = undefined;
    }

    connector &&
      activate(connector, undefined, true).catch((error) => {
        if (error instanceof UnsupportedChainIdError) {
          activate(connector); // a little janky...can't use setError because the connector isn't set
        } else {
          setPendingError(true);
        }
      });
  };

  // close wallet modal if fortmatic modal is active
  useEffect(() => {
    fortmatic.on(OVERLAY_READY, () => {
      toggleWalletModal();
    });
    // eslint-disable-next-line
  }, []);

  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask;
    return Object.keys(SUPPORTED_WALLETS).map((key) => {
      const option = SUPPORTED_WALLETS[key];
      // check for mobile options
      if (isMobile) {
        //disable portis on mobile for now
        if (option.connector === portis) {
          return null;
        }

        if (!window.web3 && !window.ethereum && option.mobile) {
          return (
            <Option
              onClick={() => {
                option.connector !== connector &&
                  !option.href &&
                  tryActivation(option.connector);
              }}
              id={`connect-${key}`}
              key={key}
              active={option.connector && option.connector === connector}
              color={option.color}
              link={option.href}
              header={option.name}
              subheader={null}
              icon={
                process.env.PUBLIC_URL + `/img/connectors/${option.iconName}`
              }
            />
          );
        }
        return null;
      }

      // overwrite injected when needed
      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          if (option.name === 'MetaMask') {
            return (
              <Option
                id={`connect-${key}`}
                key={key}
                color={'#E8831D'}
                header={'Install Metamask'}
                subheader={null}
                link={'https://metamask.io/'}
                icon={process.env.PUBLIC_URL + '/img/connectors/metamask.png'}
              />
            );
          } else {
            return null; //dont want to return install twice
          }
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === 'MetaMask' && !isMetamask) {
          return null;
        }
        // likewise for generic
        else if (option.name === 'Injected' && isMetamask) {
          return null;
        }
      }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Option
            id={`connect-${key}`}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector);
            }}
            key={key}
            active={option.connector === connector}
            color={option.color}
            link={option.href}
            header={option.name}
            subheader={null} //use option.descriptio to bring back multi-line
            icon={process.env.PUBLIC_URL + `/img/connectors/${option.iconName}`}
          />
        )
      );
    });
  }

  function getModalContent() {
    if (error) {
      return (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal}>&times;</CloseIcon>
          <HeaderRow>
            {error instanceof UnsupportedChainIdError
              ? 'Wrong Network'
              : 'Error connecting'}
          </HeaderRow>
          <ContentWrapper>
            {error instanceof UnsupportedChainIdError ? (
              <h5>{t('not_supported')}</h5>
            ) : (
              t('error_try_refresh')
            )}
          </ContentWrapper>
        </UpperSection>
      );
    }

    return (
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>&times;</CloseIcon>
        {walletView !== WALLET_VIEWS.ACCOUNT ? (
          <HeaderRow>
            <HoverText
              onClick={() => {
                setPendingError(false);
                setWalletView(WALLET_VIEWS.ACCOUNT);
              }}
            >
              Back
            </HoverText>
          </HeaderRow>
        ) : (
          <HeaderRow>
            <HoverText>Connect to a wallet</HoverText>
          </HeaderRow>
        )}
        <ContentWrapper>
          {walletView === WALLET_VIEWS.PENDING ? (
            <PendingView
              connector={pendingWallet}
              error={pendingError}
              setPendingError={setPendingError}
              tryActivation={tryActivation}
            />
          ) : (
            <OptionGrid>{getOptions()}</OptionGrid>
          )}
        </ContentWrapper>
      </UpperSection>
    );
  }

  return (
    <Modal
      isModalOpen={isConnectorsWalletOpen}
      closeModal={toggleWalletModal}
      width={'400px'}
      backDropClose
      handleModalContent
    >
      <Wrapper>{getModalContent()}</Wrapper>
    </Modal>
  );
}

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  font-size: 30px;
  z-index: 2;
  color: ${(props) => props.theme.darkText};
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`;

const Wrapper = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  background: ${(props) => props.theme.modalBg};
  border-radius: 20px;
`;

const HeaderRow = styled.div`
  padding: 1rem 1rem;
  font-weight: 500;
  color: blue;
`;

const ContentWrapper = styled.div`
  padding: 20px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`;

const UpperSection = styled.div`
  position: relative;

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`;

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 10px;
`;

const HoverText = styled.div`
  color: ${(props) => props.theme.darkText};
  position: relative;
  top: 10px;
  :hover {
    cursor: pointer;
  }
`;
