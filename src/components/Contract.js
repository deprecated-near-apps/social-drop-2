import React, { useEffect, useState } from 'react';
import * as nearAPI from 'near-api-js';
import { GAS, parseNearAmount } from '../state/near';
import {
    createAccessKeyAccount,
    getContract,
} from '../utils/near-utils';

const {
    KeyPair,
    utils: { format: { formatNearAmount } }
} = nearAPI;

export const Contract = ({ near, update, localKeys = {}, account }) => {
    if (!localKeys || !localKeys.accessPublic) return null;

    const [balanceDropped, setBalanceDropped] = useState('0');
    const [balanceTokens, setBalanceTokens] = useState('0');
    const [balanceWalletTokens, setBalanceWalletTokens] = useState('0');
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('0');

    useEffect(() => {
        if (!localKeys.accessPublic) return;
        checkDrop();
        checkWallet();
    }, [localKeys.accessPublic]);


    const checkDrop = async () => {
        const contract = getContract(createAccessKeyAccount(near, KeyPair.fromString(localKeys.accessSecret)));
        setBalanceDropped(await contract.get_balance_dropped({ public_key: localKeys.accessPublic }));
    };

    const checkReceiver = async () => {
        const contract = getContract(createAccessKeyAccount(near, KeyPair.fromString(localKeys.accessSecret)));
        setBalanceTokens(await contract.get_balance_tokens({ account_id: receiver }));
    };

    const checkWallet = async () => {
        if (!account) return
        const contract = getContract(account);
        setBalanceWalletTokens(await contract.get_balance_tokens({ account_id: account.accountId }));
    };

    const handleClaimDrop = async () => {
        const contract = getContract(createAccessKeyAccount(near, KeyPair.fromString(localKeys.accessSecret)));
        try {
            await contract.drop({}, GAS)
        } catch (e) {
            if (!/Tokens already dropped/.test(e.toString())) {
                throw e
            }
            alert('Tokens already dropped')
        }
        checkDrop()
    };

    const handleTransferDrop = async () => {
        if (!receiver.length) {
            alert('set a receiver')
            return
        }
        const contract = getContract(createAccessKeyAccount(near, KeyPair.fromString(localKeys.accessSecret)));
        try {
            await contract.transfer_drop({ account_id: receiver }, GAS)
        } catch (e) {
            if (!/No tokens/.test(e.toString())) {
                throw e
            }
            alert('No tokens')
        }
        checkDrop()
        checkWallet();
        checkReceiver()
    };

    const handleTransfer = async () => {
        if (!account) return
        if (!receiver.length) {
            alert('set a receiver')
            return
        }
        if (amount === '0') {
            alert('set amount')
            return
        }
        const contract = getContract(account);
        try {
            await contract.transfer({ account_id: receiver, amount }, GAS)
        } catch (e) {
            if (!/No tokens/.test(e.toString())) {
                throw e
            }
            alert('No tokens')
        }
        checkDrop()
        checkWallet()
        checkReceiver()
    };

    return <>
        <h3>Social Token Drop Zone</h3>
        <p>Dropped Tokens to App Key: {balanceDropped}</p>
        <button onClick={() => handleClaimDrop()}>Claim Drop</button>
        <button onClick={() => handleTransferDrop()}>Transfer Dropped Tokens to AccountId</button>
        <br />
        <p>Receiver Tokens: {balanceTokens}</p>
        <input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="AccountId of Receiver" />
        <br />
        <button onClick={() => checkReceiver()}>Check Receiver Balance</button>
        <br />
        {
            account && <>
                <p>Wallet Account: {balanceWalletTokens}</p>
                <p>Transfer Tokens from Wallet Account</p>
                <input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="AccountId of Receiver" />
                <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount to Transfer (tokens)" />
                <br />
                <button onClick={() => handleTransfer()}>Send Tokens from Wallet</button>
            </>
        }
    </>;
};

