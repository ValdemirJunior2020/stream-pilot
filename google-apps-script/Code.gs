/**
 * StreamPilot Google Sheets Auth API
 *
 * Deploy:
 * 1. Abra Extensions > Apps Script dentro da planilha.
 * 2. Cole este arquivo como Code.gs.
 * 3. Deploy > New deployment > Web app.
 * 4. Execute as: Me.
 * 5. Who has access: Anyone with the link.
 * 6. Copie a Web App URL e coloque no backend .env como SHEETS_AUTH_URL.
 *
 * A planilha deve ter uma aba chamada "Users".
 * Se não existir, o script cria automaticamente.
 */

const SPREADSHEET_ID = '1t6Y7vp9xCBsgSrw8iubQeDjlEAmWFjUEag5yo9WOTmE';
const USERS_SHEET_NAME = 'Users';

// Tem que ser igual ao SHEETS_AUTH_SECRET no backend .env.
// Troque por uma chave longa antes de publicar.
const API_SECRET = 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_32_CHARS_MIN';

const HEADERS = [
  'id',
  'name',
  'email',
  'passwordHash',
  'salt',
  'status',
  'role',
  'createdAt',
  'updatedAt',
  'lastLoginAt'
];

function doGet() {
  return jsonResponse({ ok: true, app: 'StreamPilot Sheets Auth', timestamp: new Date().toISOString() });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    assertSecret_(payload.secret);

    const action = String(payload.action || '').trim();

    if (action === 'register') {
      return jsonResponse(registerUser_(payload));
    }

    if (action === 'login') {
      return jsonResponse(loginUser_(payload));
    }

    if (action === 'getUserByEmail') {
      return jsonResponse(getUserByEmail_(payload));
    }

    return jsonResponse({ ok: false, message: 'Ação inválida.' }, 400);
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message || 'Erro interno.' }, error.statusCode || 500);
  }
}

function registerUser_(payload) {
  const name = cleanName_(payload.name);
  const email = normalizeEmail_(payload.email);
  const password = String(payload.password || '');

  if (!email || !isValidEmail_(email)) {
    throw httpError_(400, 'Email inválido.');
  }

  if (!password || password.length < 8) {
    throw httpError_(400, 'A senha precisa ter pelo menos 8 caracteres.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getUsersSheet_();
    const found = findUserRowByEmail_(sheet, email);

    if (found) {
      throw httpError_(409, 'Este email já está cadastrado.');
    }

    const now = new Date().toISOString();
    const id = Utilities.getUuid();
    const salt = Utilities.getUuid().replace(/-/g, '');
    const passwordHash = hashPassword_(password, salt);

    const row = [
      id,
      name,
      email,
      passwordHash,
      salt,
      'active',
      'user',
      now,
      now,
      ''
    ];

    sheet.appendRow(row);

    return {
      ok: true,
      user: sanitizeUser_({
        id: id,
        name: name,
        email: email,
        status: 'active',
        role: 'user',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: ''
      })
    };
  } finally {
    lock.releaseLock();
  }
}

function loginUser_(payload) {
  const email = normalizeEmail_(payload.email);
  const password = String(payload.password || '');

  if (!email || !password) {
    throw httpError_(400, 'Email e senha são obrigatórios.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getUsersSheet_();
    const found = findUserRowByEmail_(sheet, email);

    if (!found) {
      throw httpError_(401, 'Email ou senha inválidos.');
    }

    const user = found.user;

    if (String(user.status || '').toLowerCase() !== 'active') {
      throw httpError_(403, 'Usuário inativo.');
    }

    const incomingHash = hashPassword_(password, user.salt);

    if (incomingHash !== user.passwordHash) {
      throw httpError_(401, 'Email ou senha inválidos.');
    }

    const now = new Date().toISOString();
    sheet.getRange(found.rowNumber, columnIndex_('lastLoginAt')).setValue(now);
    sheet.getRange(found.rowNumber, columnIndex_('updatedAt')).setValue(now);

    user.lastLoginAt = now;
    user.updatedAt = now;

    return { ok: true, user: sanitizeUser_(user) };
  } finally {
    lock.releaseLock();
  }
}

function getUserByEmail_(payload) {
  const email = normalizeEmail_(payload.email);
  if (!email) throw httpError_(400, 'Email obrigatório.');

  const sheet = getUsersSheet_();
  const found = findUserRowByEmail_(sheet, email);

  if (!found) {
    throw httpError_(404, 'Usuário não encontrado.');
  }

  return { ok: true, user: sanitizeUser_(found.user) };
}

function getUsersSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(USERS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(USERS_SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return sheet;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getValues()[0];
  const needsHeaders = HEADERS.some(function (header, index) {
    return String(currentHeaders[index] || '') !== header;
  });

  if (needsHeaders) {
    throw httpError_(500, 'A aba Users já existe, mas os cabeçalhos não batem. Use exatamente: ' + HEADERS.join(', '));
  }

  return sheet;
}

function findUserRowByEmail_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowEmail = normalizeEmail_(row[columnIndex_('email') - 1]);

    if (rowEmail === email) {
      return {
        rowNumber: i + 2,
        user: rowToUser_(row)
      };
    }
  }

  return null;
}

function rowToUser_(row) {
  const user = {};
  HEADERS.forEach(function (header, index) {
    user[header] = row[index];
  });
  user.email = normalizeEmail_(user.email);
  return user;
}

function sanitizeUser_(user) {
  return {
    id: String(user.id || ''),
    name: String(user.name || ''),
    email: normalizeEmail_(user.email),
    status: String(user.status || 'active'),
    role: String(user.role || 'user'),
    createdAt: stringifyDate_(user.createdAt),
    updatedAt: stringifyDate_(user.updatedAt),
    lastLoginAt: user.lastLoginAt ? stringifyDate_(user.lastLoginAt) : ''
  };
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw httpError_(400, 'Payload vazio.');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw httpError_(400, 'JSON inválido.');
  }
}

function assertSecret_(secret) {
  if (!secret || String(secret) !== API_SECRET) {
    throw httpError_(401, 'Não autorizado.');
  }
}

function hashPassword_(password, salt) {
  const peppered = String(salt) + ':' + String(password);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, peppered, Utilities.Charset.UTF_8);
  return bytes.map(function (byte) {
    const value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function cleanName_(name) {
  return String(name || '').trim().slice(0, 80);
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function columnIndex_(header) {
  return HEADERS.indexOf(header) + 1;
}

function stringifyDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  return String(value || '');
}

function httpError_(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  // Apps Script ContentService não permite setar status HTTP real de forma confiável.
  // O backend lê o campo ok/message e converte para o status correto.
  return output;
}
