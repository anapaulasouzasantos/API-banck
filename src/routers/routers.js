const express = require('express');
const { listBankAccounts, createBankAccount, updateBankAccountUser, deleteBanckAccount, makeADeposit, bankDraft, makeTransfer, getBalance, bankStatement } = require('../controllers/bankAccounts');
const { validatePassword } = require('../middlewares/validatePassword');

const route = express();

route.get('/contas', validatePassword, listBankAccounts);
route.post('/contas', createBankAccount);
route.put('/contas/:numeroConta/usuario', updateBankAccountUser);
route.delete('/contas/:numeroConta', deleteBanckAccount);
route.post('/transacoes/depositar', makeADeposit);
route.post('/transacoes/sacar', bankDraft);
route.post('/transacoes/transferir', makeTransfer);
route.get('/contas/saldo', getBalance);
route.get('/contas/extrato', bankStatement);

module.exports = {
    route
}