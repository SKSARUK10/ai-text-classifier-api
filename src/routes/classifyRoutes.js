const express = require('express');
const { classifyText } = require('../controllers/classifyController');

const router = express.Router();

router.post('/', classifyText);

module.exports = router;
