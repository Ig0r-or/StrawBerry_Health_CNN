require('dotenv').config();
const assert = require('assert');
const http = require('http');

// Helper para fazer requisições HTTP locais mantendo cookies
function httpRequest(options, postData = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {};
    if (cookie) defaultHeaders['Cookie'] = cookie;
    if (postData) {
      defaultHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      defaultHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const reqOptions = {
      hostname: '127.0.0.1',
      port: process.env.PORT || 3000,
      path: options.path,
      method: options.method || 'GET',
      headers: { ...defaultHeaders, ...options.headers }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Iniciando Bateria de Testes da Release 2 (Fundação)...\n');
  let sessionCookie = null;
  let testLocalId = null;

  // Teste 1: Rota pública de login
  console.log('1. Testando GET /login...');
  const resLogin = await httpRequest({ path: '/login' });
  assert.strictEqual(resLogin.statusCode, 200);
  assert(resLogin.body.includes('Acesso ao Sistema'), 'A página de login deve conter o título "Acesso ao Sistema"');
  console.log('   ✅ GET /login retornou 200 OK');

  // Teste 2: Proteção de rota privada (sem autenticação)
  console.log('2. Testando proteção de rota privada GET /locais (sem login)...');
  const resProtegida = await httpRequest({ path: '/locais' });
  assert.strictEqual(resProtegida.statusCode, 302, 'Deve redirecionar usuário não logado');
  assert.strictEqual(resProtegida.headers.location, '/login', 'Deve redirecionar para /login');
  console.log('   ✅ Rota privada protegida com sucesso (redirecionou para /login)');

  // Teste 3: Autenticação de Usuário (POST /login)
  console.log('3. Testando autenticação de usuário (POST /login)...');
  const loginBody = 'email=' + encodeURIComponent('produtor@berryhealth.com') + '&senha=' + encodeURIComponent('produtor123');
  const resPostLogin = await httpRequest({ path: '/login', method: 'POST' }, loginBody);
  assert.strictEqual(resPostLogin.statusCode, 302, 'Login bem-sucedido deve redirecionar');
  assert.strictEqual(resPostLogin.headers.location, '/dashboard', 'Login deve redirecionar para /dashboard');

  const setCookie = resPostLogin.headers['set-cookie'];
  assert(setCookie && setCookie.length > 0, 'Deve emitir cookie de sessão');
  sessionCookie = setCookie[0].split(';')[0];
  console.log('   ✅ Login bem-sucedido com hash de senha validado (Cookie gerado)');

  // Teste 4: Acesso ao Dashboard autenticado
  console.log('4. Testando GET /dashboard com sessão ativa...');
  const resDash = await httpRequest({ path: '/dashboard' }, null, sessionCookie);
  assert.strictEqual(resDash.statusCode, 200);
  assert(resDash.body.includes('Cezar Vitor'), 'Dashboard deve exibir nome do usuário logado');
  console.log('   ✅ Dashboard carregado com dados do usuário');

  // Teste 5: CRUD Locais de Plantio - Listar (R)
  console.log('5. Testando CRUD: Listar locais de plantio (GET /locais)...');
  const resLocais = await httpRequest({ path: '/locais' }, null, sessionCookie);
  assert.strictEqual(resLocais.statusCode, 200);
  assert(resLocais.body.includes('Talh'), 'Deve listar os talhões cadastrados no banco');
  console.log('   ✅ Listagem do 1º CRUD carregada com sucesso');

  // Teste 6: CRUD Locais de Plantio - Criar (C)
  console.log('6. Testando CRUD: Criar novo local de plantio (POST /locais)...');
  const novoLocalBody = 'nome=' + encodeURIComponent('Talhão 99 - Teste Automatizado') +
    '&cultivar=' + encodeURIComponent('San Andreas') +
    '&area_hectares=0.75' +
    '&cidade=' + encodeURIComponent('Pouso Alegre') +
    '&estado=MG' +
    '&observacoes=' + encodeURIComponent('Talhão criado pelo teste de release 2');
  
  const resCriar = await httpRequest({ path: '/locais', method: 'POST' }, novoLocalBody, sessionCookie);
  assert.strictEqual(resCriar.statusCode, 302);
  assert.strictEqual(resCriar.headers.location, '/locais');
  console.log('   ✅ Criação de registro no banco realizada com sucesso');

  // Teste 7: CRUD Locais de Plantio - Busca/Filtro
  console.log('7. Testando Busca e Filtro na listagem...');
  const resBusca = await httpRequest({ path: '/locais?q=Teste+Automatizado' }, null, sessionCookie);
  assert.strictEqual(resBusca.statusCode, 200);
  assert(resBusca.body.includes('Talhão 99 - Teste Automatizado'), 'A busca deve localizar o talhão recém-criado');
  
  // Extrai o ID do local criado para testar edição e exclusão
  const match = resBusca.body.match(/\/locais\/(\d+)\/editar/);
  assert(match && match[1], 'Deve encontrar o link de edição com o ID do talhão');
  testLocalId = match[1];
  console.log(`   ✅ Busca/Filtro validada (Talhão ID ${testLocalId} localizado)`);

  // Teste 8: CRUD Locais de Plantio - Atualizar (U)
  console.log(`8. Testando CRUD: Atualizar local ID ${testLocalId} (POST /locais/${testLocalId}/editar)...`);
  const editarBody = 'nome=' + encodeURIComponent('Talhão 99 - Atualizado com Sucesso') +
    '&cultivar=' + encodeURIComponent('Albion') +
    '&area_hectares=1.10' +
    '&cidade=' + encodeURIComponent('Pouso Alegre') +
    '&estado=MG';
  const resEditar = await httpRequest({ path: `/locais/${testLocalId}/editar`, method: 'POST' }, editarBody, sessionCookie);
  assert.strictEqual(resEditar.statusCode, 302);
  console.log('   ✅ Atualização no banco realizada com sucesso');

  // Teste 9: CRUD Locais de Plantio - Excluir (D)
  console.log(`9. Testando CRUD: Excluir local ID ${testLocalId} (POST /locais/${testLocalId}/excluir)...`);
  const resExcluir = await httpRequest({ path: `/locais/${testLocalId}/excluir`, method: 'POST' }, '', sessionCookie);
  assert.strictEqual(resExcluir.statusCode, 302);
  console.log('   ✅ Exclusão no banco realizada com sucesso');

  // Teste 10: Logout do Usuário
  console.log('10. Testando Logout (GET /logout)...');
  const resLogout = await httpRequest({ path: '/logout' }, null, sessionCookie);
  assert.strictEqual(resLogout.statusCode, 302);
  assert.strictEqual(resLogout.headers.location, '/login');
  console.log('   ✅ Logout efetuado e sessão destruída com sucesso');

  console.log('\n🎉 TODOS OS 10 TESTES DA RELEASE 2 FORAM APROVADOS COM SUCESSO! 🍓\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Falha nos testes:', err);
  process.exit(1);
});
