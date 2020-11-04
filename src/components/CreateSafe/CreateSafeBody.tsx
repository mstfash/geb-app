import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useStoreActions, useStoreState } from '../../store';
import { CreateSafeType } from '../../utils/interfaces';
import Button from '../Button';
import CheckBox from '../CheckBox';
import DecimalInput from '../DecimalInput';

interface Props {
  isChecked?: boolean;
}

const CreateSafeBody = ({ isChecked }: Props) => {
  const { t } = useTranslation();
  const [checkUniSwapPool, setCheckUniSwapPool] = useState(isChecked || false);
  const [defaultSafe, setDefaultSafe] = useState<CreateSafeType>({
    depositedETH: '',
    borrowedRAI: '',
  });

  const [uniSwapVal, setUniSwapVal] = useState<CreateSafeType>({
    depositedETH: '',
    borrowedRAI: '',
  });

  const {
    walletModel: walletActions,
    popupsModel: popupsActions,
  } = useStoreActions((state) => state);
  const { walletModel: walletState } = useStoreState((state) => state);
  const { createSafeDefault, uniSwapPool } = walletState;

  const submitDefaultValues = () => {
    walletActions.setCreateSafeDefault(defaultSafe);
    walletActions.setIsUniSwapPoolChecked(checkUniSwapPool);
    if (checkUniSwapPool) {
      walletActions.setStage(1);
    } else {
      walletActions.setStage(2);
    }
  };

  const submitUniSwapPool = () => {
    walletActions.setUniSwapPool(uniSwapVal);
    walletActions.setStage(2);
  };

  const handleCancel = () => {
    if (isChecked) {
      walletActions.setStage(0);
    } else {
      walletActions.setIsUniSwapPoolChecked(false);
      walletActions.setStage(0);
      popupsActions.setIsCreateAccountModalOpen(false);
      walletActions.setUniSwapPool({
        depositedETH: '',
        borrowedRAI: '',
      });
      walletActions.setCreateSafeDefault({
        depositedETH: '',
        borrowedRAI: '',
      });
      setUniSwapVal({
        depositedETH: '',
        borrowedRAI: '',
      });
      setDefaultSafe({
        depositedETH: '',
        borrowedRAI: '',
      });
    }
  };

  useEffect(() => {
    setDefaultSafe(createSafeDefault);
    setUniSwapVal(uniSwapPool);
  }, [createSafeDefault, uniSwapPool]);

  return (
    <>
      <Body>
        <DoubleInput>
          <DecimalInput
            label={'Deposit ETH (Avail 0.00)'}
            value={defaultSafe.depositedETH}
            onChange={(val: string) =>
              setDefaultSafe({ ...defaultSafe, depositedETH: val })
            }
            disableMax
            disabled={isChecked}
          />
          <DecimalInput
            label={'Borrow RAI (Avail 0.00)'}
            value={defaultSafe.borrowedRAI}
            onChange={(val: string) =>
              setDefaultSafe({ ...defaultSafe, borrowedRAI: val })
            }
            disableMax
            disabled={isChecked}
          />
        </DoubleInput>

        {isChecked ? (
          <DoubleInput>
            <DecimalInput
              label={'ETH on Uniswap (Avail 0.00)'}
              value={uniSwapVal ? uniSwapVal.depositedETH : ''}
              onChange={(val: string) =>
                setUniSwapVal({ ...uniSwapVal, depositedETH: val })
              }
            />
            <DecimalInput
              label={'RAI on Uniswap (Avail 0.00)'}
              value={uniSwapVal ? uniSwapVal.borrowedRAI : ''}
              onChange={(val: string) =>
                setUniSwapVal({ ...uniSwapVal, borrowedRAI: val })
              }
              disableMax
            />
          </DoubleInput>
        ) : null}

        <Result>
          <Block>
            <Item>
              <Label>{'Collateral Ratio'}</Label> <Value>{'250.00%'}</Value>
            </Item>
            <Item>
              <Label>{'Liquidation Price'}</Label> <Value>{'$300.00'}</Value>
            </Item>
            <Item>
              <Label>{'Liquidation Penalty'}</Label> <Value>{'11.00%'}</Value>
            </Item>
          </Block>
        </Result>

        {isChecked ? null : (
          <UniSwapCheckContainer>
            <Text>{t('uniswap_modal_check_text')}</Text>
            <CheckBox
              checked={checkUniSwapPool}
              onChange={(state: boolean) => {
                setCheckUniSwapPool(state);
                walletActions.setIsUniSwapPoolChecked(state);
              }}
            />
          </UniSwapCheckContainer>
        )}
      </Body>
      <Footer>
        <Button
          dimmed={!isChecked}
          text={t(isChecked ? 'back' : 'cancel')}
          onClick={handleCancel}
          dimmedWithArrow={isChecked}
        />
        <Button
          withArrow
          onClick={isChecked ? submitUniSwapPool : submitDefaultValues}
          text={t(
            checkUniSwapPool && !isChecked
              ? 'uniswap_pool'
              : 'review_transaction'
          )}
        />
      </Footer>
    </>
  );
};

export default CreateSafeBody;

const DoubleInput = styled.div`
  display: flex;
  margin-bottom: 20px;
  > div {
    &:last-child {
      flex: 0 0 calc(57% + 10px);
      margin-left: -10px;
    }
    &:first-child {
      flex: 0 0 44%;
      input {
      }
    }
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    > div {
      flex: 0 0 100%;
      max-width: 100%;
      &:last-child {
        margin-left: 0;
        margin-top: 20px;
      }
    }
  `}
`;

const Result = styled.div`
  border-radius: ${(props) => props.theme.global.borderRadius};
  border: 1px solid ${(props) => props.theme.colors.border};
  background: ${(props) => props.theme.colors.foreground};
`;

const Block = styled.div`
  border-bottom: 1px solid;
  padding: 16px 20px;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  &:last-child {
    border-bottom: 0;
  }
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  font-size: ${(props) => props.theme.font.small};
  color: ${(props) => props.theme.colors.secondary};
  letter-spacing: -0.09px;
  line-height: 21px;
`;

const Value = styled.div`
  font-size: ${(props) => props.theme.font.small};
  color: ${(props) => props.theme.colors.primary};
  letter-spacing: -0.09px;
  line-height: 21px;
  font-weight: 600;
`;

const UniSwapCheckContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const Text = styled.div`
  line-height: 18px;
  letter-spacing: -0.18px;
  color: ${(props) => props.theme.colors.secondary};
  font-size: ${(props) => props.theme.font.extraSmall};
`;

const Body = styled.div`
  padding: 20px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px;
`;
