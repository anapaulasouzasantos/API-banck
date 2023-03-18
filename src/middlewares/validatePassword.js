const { banco } = require('../database/bancodedados');
const password = banco.senha;

const validatePassword = (req, res, next) => {
    const { senha_banco: bankPassword } = req.query

    if (!bankPassword) {
        return res.status(400).json({ "mensagem": "Voce precisa informar a senha!" });
    }

    if (bankPassword !== password) {
        return res.status(401).json({ "mensagem": "A senha do banco informada é inválida!" })
    }

    next()
}

module.exports = {
    validatePassword
}