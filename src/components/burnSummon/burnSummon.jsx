import React, { Component,useState } from "react";
import {withNamespaces} from "react-i18next";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import {Button, InputAdornment, TextField, Typography} from "@material-ui/core";
import {colors} from "../../theme";
import Web3 from "web3";
import config from "../../config";
import Store from "../../stores";
import axios from "axios";
import BigNumber from "bignumber.js";

const styles = theme => ({
    root: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '900px',
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: '40px'
    },
    disaclaimer: {
        padding: '12px',
        border: '1px solid rgb(174, 174, 174)',
        borderRadius: '0.75rem',
        marginBottom: '24px',
        background: colors.white,
    },
    overview: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '28px 30px',
        borderRadius: '50px',
        border: '1px solid '+colors.borderBlue,
        alignItems: 'center',
        marginTop: '40px',
        width: '100%',
        background: colors.white
    },
    overviewField: {
        display: 'flex',
        flexDirection: 'column'
    },
    overviewTitle: {
        color: colors.darkGray
    },
    overviewValue: {

    },
    valContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
    },
    actionInput: {
        padding: '0px 0px 12px 0px',
        fontSize: '0.5rem'
    },
    inputAdornment: {
        fontWeight: '600',
        fontSize: '1.5rem'
    },
    assetIcon: {
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: '25px',
        background: '#dedede',
        height: '30px',
        width: '30px',
        textAlign: 'center',
        marginRight: '16px'
    },
});

const emitter = Store.emitter
const dispatcher = Store.dispatcher
const store = Store.store

class BurnSummon extends Component {

    constructor(props) {
        super();
        this.state = {}
    }

    onChange = (event) => {
        let val = []
        val[event.target.id] = event.target.value
        this.setState(val)
    };

    hex2int(hex) {
        if (hex.startsWith('0x'))
            hex = hex.substr(2);
        let len = hex.length, a = new Array(len), code;
        for (let i = 0; i < len; i++) {
            code = hex.charCodeAt(i);
            if (48<=code && code < 58) {
                code -= 48;
            } else {
                code = (code & 0xdf) - 65 + 10;
            }
            a[i] = code;
        }

        return a.reduce(function(acc, c) {
            acc = 16 * acc + c;
            return acc;
        }, 0);
    }

    getGas = async ()=>{
        const url = 'https://rpc.ftm.tools';
        const data = {"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":73};
        const response = await axios.post(url, data);
        console.log(response);
        // const gasP = this.hex2int(response.data.result);
        // console.log(gasP);
        // return new BigNumber(gasP);
        return response.data.result;
            // .then((response) => {
            //     setGasPrice(hex2int(response.data.result)/10**9)
            // })
    };

    burn = async ()=>{
        const tokenID = this.state['tokenIdInput'];
        if (tokenID && tokenID>0) {
            const account = store.getStore('account');
            console.log(account.address);
            const web3 = new Web3(store.getStore('web3context').library.provider);

            const rarity = new web3.eth.Contract(config.rarityABI, config.rarityAddress);
            console.log(rarity)
            //approve
            const approveAddress = await rarity.methods.getApproved(tokenID).call();
            if (approveAddress ===  config.lrrAddress){
                const gasP = await this.getGas();
                console.log(gasP);
                const lrr = new web3.eth.Contract(config.lrrABI, config.lrrAddress);
                await lrr.methods.burnRarityToken(tokenID).send({ from: account.address, gasPrice: gasP});
                alert('Burn success!');
            } else {
                alert('Approve first...');
                const gasP = await this.getGas();
                console.log(gasP);
                await rarity.methods.approve(config.lrrAddress, tokenID).send({ from: account.address, gasPrice: gasP});
                alert('Approve success, please try again!');
            }
        }
    };

    render() {
        const { classes, t, location } = this.props;

        const amount = this.state['tokenIdInput']
        const amountError = this.state['tokenIdInput_error']

        return(
            // eslint-disable-next-line react/react-in-jsx-scope
            <div className={ classes.root }>
                <Typography variant={'h5'} className={ classes.disaclaimer }>This project is in beta. Use at your own risk.</Typography>
                <div className={ classes.valContainer } >
                    <div>
                        <TextField
                            fullWidth
                            disabled={ false }
                            className={ classes.actionInput }
                            id={ 'tokenIdInput' }
                            value={ amount }
                            error={ amountError }
                            onChange={ this.onChange }
                            placeholder="Please input Rarity Token ID"
                            variant="outlined"
                            InputProps={{
                                // endAdornment: <InputAdornment position="end" className={ classes.inputAdornment }></InputAdornment>,
                                startAdornment: <InputAdornment position="end" className={ classes.inputAdornment }>
                                </InputAdornment>,
                            }}
                        />
                    </div>
                </div>
                <div className={ classes.actionContainer}>
                    <Button
                        fullWidth
                        className={ classes.actionButton }
                        variant="outlined"
                        color="primary"
                        disabled={ false }
                        onClick={ () => { this.burn() } }
                    >
                        <Typography className={ classes.buttonText } variant={ 'h4'}>Burn</Typography>
                    </Button>
                </div>
            </div>
        )
    }
}

export default withNamespaces()(withRouter(withStyles(styles)(BurnSummon)));
