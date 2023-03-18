const { contas, saques, depositos, transferencias } = require('../database/bancodedados');
const { format } = require('date-fns')
let accountId = 1

const listBankAccounts = (req, res) => {
    return res.status(200).json(contas)
}

const createBankAccount = (req, res) => {
    const { nome: name, cpf, data_nascimento: birthDate, telefone: telephone, email, senha: password } = req.body;

    const validBankDetails = validateAccountInformation(name, cpf, birthDate, telephone, email, password);

    if (!validBankDetails) {
        return res.status(400).json({ "mensagem": "Todos os campos são obrigatórios!" });
    }

    const cpfDataFound = verifyCpf(cpf);
    const foundEmailData = checkEmail(email);
    if (cpfDataFound || foundEmailData) {
        return res.status(400).json({ "mensagem": "Já existe uma conta com o cpf ou e-mail informado!" });
    }

    const newAccount = {
        numero: accountId++,
        saldo: 0,
        usuario: {
            nome: name,
            cpf,
            data_nascimento: birthDate,
            telefone: telephone,
            email,
            senha: password
        }
    }

    contas.push(newAccount);

    return res.status(201).json()
}

const updateBankAccountUser = (req, res) => {
    const { numeroConta: accountNumber } = req.params;
    const { nome: name, cpf, data_nascimento: birthDate, telefone: telephone, email, senha: password } = req.body;

    const validBankDetails = validateAccountInformation(name, cpf, birthDate, telephone, email, password);
    if (!validBankDetails) {
        return res.status(400).json({ "mensagem": "Todos os campos são obrigatórios!" });
    }

    const accountIndexNumber = checkNumber(Number(accountNumber));
    if (accountIndexNumber === -1) {
        return res.status(400).json({ "mensagem": "Numero da conta não encontrado" })
    }

    const cpfDataFound = verifyCpf(cpf);
    if (cpfDataFound) {
        return res.status(400).json({ "mensagem": "O CPF informado já existe cadastrado!" });
    }

    const foundEmailData = checkEmail(email);
    if (foundEmailData) {
        return res.status(400).json({ "mensagem": "O EMAIL informado já existe cadastrado!" });
    }

    contas[accountIndexNumber].usuario = {
        nome: name,
        cpf,
        data_nascimento: birthDate,
        telefone: telephone,
        email,
        senha: password
    }

    return res.status(200).json()
}

const deleteBanckAccount = (req, res) => {
    const { numeroConta: accountNumber } = req.params;

    const accountIndexNumber = checkNumber(Number(accountNumber));
    if (accountIndexNumber === -1) {
        return res.status(404).json({ "mensagem": "Numero da conta não encontrado" })
    }

    if (contas[accountIndexNumber].saldo > 0) {
        return res.status(403).json({ "mensagem": "A conta só pode ser removida se o saldo for zero!" })
    }

    contas.splice(accountIndexNumber, 1);

    return res.status(204).json();
}

const makeADeposit = (req, res) => {
    const { numero_conta: accountNumber, valor: value } = req.body;

    if (!accountNumber || !value) {
        return res.status(400).json({ "mensagem": "O número da conta e o valor são obrigatórios!" });
    }

    const accountIndexNumber = checkNumber(Number(accountNumber));
    if (accountIndexNumber === -1) {
        return res.status(404).json({ "mensagem": "Numero da conta não encontrado" });
    }

    if (value <= 0) {
        return res.status(400).json({ "mensagem": "Valor de deposito invalido!" });
    }

    contas[accountIndexNumber].saldo += value

    const registerDeposit = {
        data: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        numero_conta: accountNumber,
        valor: value
    }

    depositos.push(registerDeposit);

    return res.status(200).json()
}

const bankDraft = (req, res) => {
    const { numero_conta: accountNumber, valor: value, senha: password } = req.body;

    if (!accountNumber || !value || !password) {
        return res.status(400).json({ "mensagem": "O número da conta, o valor e a senha são obrigatórios!" });
    }

    const accountIndexNumber = checkNumber(Number(accountNumber));
    if (accountIndexNumber === -1) {
        return res.status(404).json({ "mensagem": "Numero da conta não encontrado" });
    }

    if (password !== contas[accountIndexNumber].usuario.senha) {
        return res.status(401).json({ "mensagem": "A senha informada esta incorreta!" });
    }

    if (contas[accountIndexNumber].saldo < value) {
        return res.status(403).json({ "mensagem": "Saldo Indisponivel!" });
    }

    contas[accountIndexNumber].saldo -= value;

    const registerBankDraft = {
        data: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        numero_conta: accountNumber,
        valor: value
    }

    saques.push(registerBankDraft);

    return res.status(201).json()
}

const makeTransfer = (req, res) => {
    const { numero_conta_origem: originAccountNumber, numero_conta_destino: destinationAccountNumber, valor: value, senha: password } = req.body;

    if (!originAccountNumber || !destinationAccountNumber || !value || !password) {
        return res.status(400).json({ "mensagem": "O número da conta de origem, o numero da conta de destino, o valor e a senha são obrigatórios!" });
    }

    const sourceAccountIndexNumber = checkNumber(Number(originAccountNumber));
    if (sourceAccountIndexNumber === -1) {
        return res.status(404).json({ "mensagem": "Numero da conta de origem não encontrado" });
    }

    const targetAccountIndexNumber = checkNumber(Number(destinationAccountNumber));
    if (targetAccountIndexNumber === -1) {
        return res.status(404).json({ "mensagem": "Numero da conta destino não encontrado" });
    }

    if (password !== contas[sourceAccountIndexNumber].usuario.senha) {
        return res.status(401).json({ "mensagem": "A senha informada esta incorreta!" });
    }

    if (contas[sourceAccountIndexNumber].saldo < value) {
        return res.status(400).json({ "mensagem": "Saldo Indisponivel!" });
    }

    contas[sourceAccountIndexNumber].saldo -= value;
    contas[targetAccountIndexNumber].saldo += value;

    const registerTransference = {
        data: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        numero_conta_origem: originAccountNumber,
        numero_conta_destino: destinationAccountNumber,
        valor: value
    }

    transferencias.push(registerTransference);

    return res.status(200).json()
}

const getBalance = (req, res) => {
    const { numero_conta: accountNumber, senha: password } = req.query;

    if (!accountNumber || !password) {
        return res.status(400).json({ "mensagem": "Numero da conta e senha precisam ser informados!" });
    }

    const accountIndexNumber = checkNumber(Number(accountNumber));
    if (accountIndexNumber === -1) {
        return res.status(400).json({ "mensagem": "Conta bancária não encontada!" });
    }

    if (password !== contas[accountIndexNumber].usuario.senha) {
        return res.status(401).json({ "mensagem": "A senha informada esta incorreta!" });
    }

    return res.status(200).json({ "saldo": `${contas[accountIndexNumber].saldo}` });
}

const bankStatement = (req, res) => {
    const { numero_conta: accountNumber, senha: password } = req.query;

    if (!accountNumber || !password) {
        return res.status(400).json({ "mensagem": "Numero da conta e senha precisam ser informados!" });
    }

    const accountIndexNumber = checkNumber(Number(accountNumber));
    if (accountIndexNumber === -1) {
        return res.status(400).json({ "mensagem": "Conta bancária não encontada!" });
    }

    if (password !== contas[accountIndexNumber].usuario.senha) {
        return res.status(401).json({ "mensagem": "A senha informada esta incorreta!" });
    }

    const depositos = filterDepositsByAccount(accountNumber);
    const saques = filterBankAccountWithdrawals(accountNumber);
    const transferenciasEnviadas = filterTransfersSentFromBankAccount(accountNumber);
    const transferenciasRecebidas = filterIncomingBankAccountTransfers(accountNumber);
    const accountBankStatement = {
        depositos,
        saques,
        transferenciasEnviadas,
        transferenciasRecebidas
    }

    return res.status(200).json(accountBankStatement)
}

const validateAccountInformation = (name, cpf, birthDate, telephone, email, password) => {
    if (!name || !cpf || !birthDate || !telephone || !email || !password) {
        return false;
    }

    return true;
}

const verifyCpf = (cpf) => {
    const cpfFound = contas.find((conta) => {
        return conta.usuario.cpf === cpf;
    })

    return cpfFound;
}

const checkEmail = (email) => {
    const findEmail = contas.find((conta) => {
        return conta.usuario.email === email;
    })

    return findEmail;
}

const checkNumber = (accountNumber) => {
    const accountIndex = contas.findIndex((conta) => {
        return conta.numero === accountNumber
    })

    return accountIndex
}

const filterDepositsByAccount = (numeroConta) => {
    const filterDeposits = depositos.filter((deposit) => {
        return deposit.numero_conta === numeroConta;
    })

    return filterDeposits
}

const filterBankAccountWithdrawals = (numeroConta) => {
    const filterWithdrawals = saques.filter((withdrawals) => {
        return withdrawals.numero_conta === numeroConta;
    })

    return filterWithdrawals
}

const filterTransfersSentFromBankAccount = (numeroConta) => {
    const filterOutgoingTransfers = transferencias.filter((transfer) => {
        return transfer.numero_conta_origem === numeroConta
    })

    return filterOutgoingTransfers;
}

const filterIncomingBankAccountTransfers = (numeroConta) => {
    const filterIncomingTransfers = transferencias.filter((transfer) => {
        return transfer.numero_conta_destino === numeroConta
    })

    return filterIncomingTransfers;
}

module.exports = {
    listBankAccounts,
    createBankAccount,
    updateBankAccountUser,
    deleteBanckAccount,
    makeADeposit,
    bankDraft,
    makeTransfer,
    getBalance,
    bankStatement
}