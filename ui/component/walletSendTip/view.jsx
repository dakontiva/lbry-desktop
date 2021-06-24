// @flow
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import React from 'react';
import Button from 'component/button';
import { FormField, Form } from 'component/common/form';
import { MINIMUM_PUBLISH_BID } from 'constants/claim';
import CreditAmount from 'component/common/credit-amount';
import I18nMessage from 'component/i18nMessage';
import { Lbryio } from 'lbryinc';
import Card from 'component/common/card';
import classnames from 'classnames';
import ChannelSelector from 'component/channelSelector';
import LbcSymbol from 'component/common/lbc-symbol';
import { parseURI } from 'lbry-redux';
import usePersistedState from 'effects/use-persisted-state';
import WalletSpendableBalanceHelp from 'component/walletSpendableBalanceHelp';

const DEFAULT_TIP_AMOUNTS = [1, 5, 25, 100];

type SupportParams = { amount: number, claim_id: string, channel_id?: string };

type Props = {
  uri: string,
  claimIsMine: boolean,
  title: string,
  claim: StreamClaim,
  isPending: boolean,
  isSupport: boolean,
  sendSupport: (SupportParams, boolean) => void,
  closeModal: () => void,
  balance: number,
  fetchingChannels: boolean,
  instantTipEnabled: boolean,
  instantTipMax: { amount: number, currency: string },
  activeChannelClaim: ?ChannelClaim,
  incognito: boolean,
};

function WalletSendTip(props: Props) {
  const {
    uri,
    title,
    isPending,
    claimIsMine,
    balance,
    claim = {},
    instantTipEnabled,
    instantTipMax,
    sendSupport,
    closeModal,
    fetchingChannels,
    incognito,
    activeChannelClaim,
  } = props;
  const [presetTipAmount, setPresetTipAmount] = usePersistedState('comment-support:presetTip', DEFAULT_TIP_AMOUNTS[0]);
  const [customTipAmount, setCustomTipAmount] = usePersistedState('comment-support:customTip', 1.0);
  const [useCustomTip, setUseCustomTip] = usePersistedState('comment-support:useCustomTip', false);
  const [tipError, setTipError] = React.useState();
  const [sendAsTip, setSendAsTip] = usePersistedState('comment-support:sendAsTip', true);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const { claim_id: claimId } = claim;
  const { channelName } = parseURI(uri);
  const noBalance = balance === 0;
  const tipAmount = useCustomTip ? customTipAmount : presetTipAmount;
  // TODO: what does this mean?
  const [activeTab, setActiveTab] = usePersistedState('comment-support:activeTab', 'TipLBC');

  let iconToUse;
  if (activeTab === 'Boost') {
    iconToUse = ICONS.LBC;
  } else if (activeTab === 'TipFiat') {
    iconToUse = ICONS.FINANCE;
  } else if (activeTab === 'TipLBC') {
    iconToUse = ICONS.LBC;
  }

  function buildButtonText(amount){
    if (activeTab === 'Boost') {
      return 'Boost This Content';
    } else if (activeTab === 'TipFiat') {
      return 'Send a ' + amount + ' amount';
    } else if (activeTab === 'TipLBC') {
      return 'Send a ' + amount + ' amount';
    }
  }

  // let buttonText;
  // if (activeTab === 'Boost') {
  //   buttonText = 'Boost This Content';
  // } else if (activeTab === 'TipFiat') {
  //   buttonText = ICONS.FINANCE;
  // } else if (activeTab === 'TipLBC') {
  //   buttonText = ICONS.LBC;

    // isSupport
    // ? __('Boost This Content')
    // : __('Send a %amount% Tip', { amount: tipAmount ? `${tipAmount} Credit` : '' })


  const isSupport = claimIsMine || !sendAsTip;

  React.useEffect(() => {

    // TODO: what is this regexp testing against? number from 0-8?
    const regexp = RegExp(/^(\d*([.]\d{0,8})?)$/);
    const validTipInput = regexp.test(String(tipAmount));
    let tipError;

    if (!tipAmount) {
      tipError = __('Amount must be a number');
    } else if (tipAmount <= 0) {
      tipError = __('Amount must be a positive number');
    } else if (tipAmount < MINIMUM_PUBLISH_BID) {
      tipError = __('Amount must be higher');
    } else if (!validTipInput) {
      tipError = __('Amount must have no more than 8 decimal places');
    } else if (tipAmount === balance) {
      tipError = __('Please decrease the amount to account for transaction fees');
    } else if (tipAmount > balance) {
      tipError = __('Not enough Credits');
    }
    setTipError(tipError);
  }, [tipAmount, balance, setTipError]);

  //
  function sendSupportOrConfirm(instantTipMaxAmount = null) {
    // send a tip
    if (
      !isSupport &&
      !isConfirming &&
      (!instantTipMaxAmount || !instantTipEnabled || tipAmount > instantTipMaxAmount)
    ) {
      setIsConfirming(true);
    } else {
      // send a boost
      const supportParams: SupportParams = { amount: tipAmount, claim_id: claimId };

      // include channel name if donation not anonymous
      if (activeChannelClaim && !incognito) {
        supportParams.channel_id = activeChannelClaim.claim_id;
      }

      // send tip/boost
      sendSupport(supportParams, isSupport);
      closeModal();
    }
  }

  // when the form button is clicked
  function handleSubmit() {
    if (tipAmount && claimId) {
      // send an instant tip (no need to go to an exchange first)
      if (instantTipEnabled) {
        if (instantTipMax.currency === 'LBC') {
          sendSupportOrConfirm(instantTipMax.amount);
        } else {
          // Need to convert currency of instant purchase maximum before trying to send support
          Lbryio.getExchangeRates().then(({ LBC_USD }) => {
            sendSupportOrConfirm(instantTipMax.amount / LBC_USD);
          });
        }
      } else {
        sendSupportOrConfirm();
      }
    }
  }

  function handleCustomPriceChange(event: SyntheticInputEvent<*>) {
    const tipAmount = parseFloat(event.target.value);
    setCustomTipAmount(tipAmount);
  }

  return (
    <Form onSubmit={handleSubmit}>
      {/* if there is no LBC balance, show user frontend to get credits */}
      {noBalance ? (
        <Card
          title={<I18nMessage tokens={{ lbc: <LbcSymbol size={22} /> }}>Supporting content requires %lbc%</I18nMessage>}
          subtitle={
            <I18nMessage tokens={{ lbc: <LbcSymbol /> }}>
              With %lbc%, you can send tips to your favorite creators, or help boost their content for more people to
              see.
            </I18nMessage>
          }
          actions={
            <div className="section__actions">
              <Button
                icon={ICONS.REWARDS}
                button="primary"
                label={__('Earn Rewards')}
                navigate={`/$/${PAGES.REWARDS}`}
              />
              <Button icon={ICONS.BUY} button="secondary" label={__('Buy/Swap Credits')} navigate={`/$/${PAGES.BUY}`} />
              <Button button="link" label={__('Nevermind')} onClick={closeModal} />
            </div>
          }
        />
      ) : (
        // if there is lbc, the main card
        <Card
          title={<LbcSymbol postfix={claimIsMine ? __('Boost your content') : __('Support this content')} size={22} />}
          subtitle={
            <React.Fragment>
              {!claimIsMine && (
                <div className="section">
                  {/* tip LBC section */}
                  <Button
                    key="tip"
                    icon={ICONS.LBC}
                    label={__('Tip LBC')}
                    button="alt"
                    onClick={() => setActiveTab('TipLBC')}
                    className={classnames('button-toggle', { 'button-toggle--active': activeTab === 'TipLBC' })}
                  />
                  {/* tip fiat section */}
                  <Button
                    key="tip-fiat"
                    icon={ICONS.FINANCE}
                    label={__('Tip Fiat')}
                    button="alt"
                    onClick={() => setActiveTab('TipFiat')}
                    className={classnames('button-toggle', { 'button-toggle--active': activeTab === 'TipFiat' })}
                  />
                  {/* tip LBC section */}
                  <Button
                    key="boost"
                    icon={ICONS.TRENDING}
                    label={__('Boost')}
                    button="alt"
                    onClick={() => setActiveTab('Boost')}
                    className={classnames('button-toggle', { 'button-toggle--active': activeTab === 'Boost' })}
                  />
                </div>
              )}

              {/* short explainer under the button */}
              <div className="section__subtitle">
                {isSupport
                  ? __(
                      'This will increase the overall bid amount for this content, which will boost its ability to be discovered while active.'
                    )
                  : __('Show this channel your appreciation by sending a donation.')}{' '}
                <Button label={__('Learn more')} button="link" href="https://lbry.com/faq/tipping" />
              </div>
            </React.Fragment>
          }
          actions={
            // if the transaction is confirming?
            isConfirming ? (
              <>
                <div className="section section--padded card--inline confirm__wrapper">
                  <div className="section">
                    <div className="confirm__label">{__('To --[the tip recipient]--')}</div>
                    <div className="confirm__value">{channelName || title}</div>
                    <div className="confirm__label">{__('From --[the tip sender]--')}</div>
                    <div className="confirm__value">
                      {activeChannelClaim && !incognito ? activeChannelClaim.name : __('Anonymous')}
                    </div>
                    <div className="confirm__label">{__(isSupport ? 'Boosting' : 'Tipping')}</div>
                    <div className="confirm__value">
                      <LbcSymbol postfix={tipAmount} size={22} />
                    </div>
                  </div>
                </div>
                <div className="section__actions">
                  <Button
                    autoFocus
                    onClick={handleSubmit}
                    button="primary"
                    disabled={isPending}
                    label={__('Confirm')}
                  />
                  <Button button="link" label={__('Cancel')} onClick={() => setIsConfirming(false)} />
                </div>
              </>
            ) : (
              <>
                <div className="section">
                  <ChannelSelector />
                </div>

                {/* section to pick tip/boost amount */}
                <div className="section">
                  {DEFAULT_TIP_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      disabled={amount > balance && activeTab !== 'TipFiat'}
                      button="alt"
                      className={classnames('button-toggle button-toggle--expandformobile', {
                        'button-toggle--active': tipAmount === amount,
                        'button-toggle--disabled': amount > balance,
                      })}
                      label={amount}
                      icon={iconToUse}
                      onClick={() => {
                        setPresetTipAmount(amount);
                        setUseCustomTip(false);
                      }}
                    />
                  ))}
                  <Button
                    button="alt"
                    className={classnames('button-toggle button-toggle--expandformobile', {
                      'button-toggle--active': !DEFAULT_TIP_AMOUNTS.includes(tipAmount),
                    })}
                    icon={iconToUse}
                    label={__('Custom')}
                    onClick={() => setUseCustomTip(true)}
                  />
                  {DEFAULT_TIP_AMOUNTS.some((val) => val > balance) && activeTab !== 'TipFiat' && (
                    <Button
                      button="secondary"
                      className="button-toggle-group-action"
                      icon={ICONS.BUY}
                      title={__('Buy or swap more LBRY Credits')}
                      navigate={`/$/${PAGES.BUY}`}
                    />
                  )}
                </div>

                {useCustomTip && (
                  <div className="section">
                    <FormField
                      autoFocus
                      name="tip-input"
                      label={
                        <React.Fragment>
                          {__('Custom support amount')}{' '}
                          <I18nMessage
                            tokens={{ lbc_balance: <CreditAmount precision={4} amount={balance} showLBC={false} /> }}
                          >
                            (%lbc_balance% Credits available)
                          </I18nMessage>
                        </React.Fragment>
                      }
                      className="form-field--price-amount"
                      error={tipError}
                      min="0"
                      step="any"
                      type="number"
                      placeholder="1.23"
                      value={customTipAmount}
                      onChange={(event) => handleCustomPriceChange(event)}
                    />
                  </div>
                )}

                {/* send tip/boost button */}
                <div className="section__actions">
                  <Button
                    autoFocus
                    icon={isSupport ? ICONS.TRENDING : ICONS.SUPPORT}
                    button="primary"
                    type="submit"
                    disabled={fetchingChannels || isPending || tipError || !tipAmount}
                    label={buildButtonText()}
                  />
                  {fetchingChannels && <span className="help">{__('Loading your channels...')}</span>}
                </div>
                <WalletSpendableBalanceHelp />
              </>
            )
          }
        />
      )}
    </Form>
  );
}

export default WalletSendTip;
