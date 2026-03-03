import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginUser(email: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }) // Suponiendo contraseñas por defecto
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Login failed for ${email}: ${JSON.stringify(error)}`);
  }
  
  const data = await response.json() as { token: string };
  return data.token;
}

async function createUser(token: string, buildingId: string, userData: any) {
  const response = await fetch(`${BASE_URL}/buildings/${buildingId}/users`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

async function main() {
  console.log('--- Iniciando Test de RBAC para Alta de Usuarios ---');

  // Asegúrate de que los emails y buildingId correspondan a tu base de datos local
  const superAdminEmail = 'ezequiel@example.com'; 
  const buildingId = 'edificio-123'; // Cambia a un UUID de edificio real si lo hay

  let superAdminToken;
  try {
     superAdminToken = await loginUser(superAdminEmail);
     console.log('✅ Super Admin Logeado');
  } catch (err) {
      console.log('❌ No se encontró Super Admin con ese email.', err);
      return;
  }

  // 1. Super Admin crea un Admin
  const adminEmail = `admin-${Date.now()}@test.com`;
  console.log(`\n1. Intentando crear Admin usando el SuperAdmin...`);
  const adminRes = await createUser(superAdminToken, buildingId, {
    email: adminEmail,
    firstName: 'Admin',
    lastName: 'Generado',
    password: 'password123',
    roleName: 'Admin'
  });
  
  if (adminRes.status === 201) {
    console.log('✅ Éxito: Super Admin creó un Admin');
  } else {
    console.log('❌ Falló la creación de Admin:', adminRes.data);
  }

  // Hacer login con el nuevo Admin
  const adminToken = await loginUser(adminEmail);

  // 2. Admin intenta crear otro Admin (Debe fallar)
  const falseAdminEmail = `falseadmin-${Date.now()}@test.com`;
  console.log(`\n2. Intentando crear Admin usando el Admin recién creado...`);
  const adminFailRes = await createUser(adminToken, buildingId, {
    email: falseAdminEmail,
    firstName: 'Otro',
    lastName: 'Admin',
    password: 'password123',
    roleName: 'Admin'
  });

  if (adminFailRes.status === 403) {
    console.log('✅ Éxito: Admin fue bloqueado (403) al intentar crear otro Admin.');
  } else {
    console.log('❌ Falló: El admin pudo crear otro Admin o dio otro error:', adminFailRes.data);
  }

  // 3. Admin intenta crear un Owner (Debe ser éxito)
  const ownerEmail = `owner-${Date.now()}@test.com`;
  console.log(`\n3. Intentando crear Owner usando el Admin recién creado...`);
  const ownerRes = await createUser(adminToken, buildingId, {
    email: ownerEmail,
    firstName: 'Owner',
    lastName: 'Generado',
    password: 'password123',
    roleName: 'Owner'
  });

  if (ownerRes.status === 201) {
    console.log('✅ Éxito: Admin pudo crear un Owner.');
  } else {
    console.log('❌ Falló la creación de Owner:', ownerRes.data);
  }

  // Hacer login con el nuevo Owner
  const ownerToken = await loginUser(ownerEmail);

  // 4. Owner intenta crear un Roomer (Debe ser éxito)
  const roomerEmail = `roomer-${Date.now()}@test.com`;
  console.log(`\n4. Intentando crear Roomer usando el Owner recién creado...`);
  const roomerRes = await createUser(ownerToken, buildingId, {
    email: roomerEmail,
    firstName: 'Roomer',
    lastName: 'Generado',
    password: 'password123',
    roleName: 'Roomer'
  });

  if (roomerRes.status === 201) {
    console.log('✅ Éxito: Owner pudo crear un Roomer.');
  } else {
    console.log('❌ Falló la creación de Roomer:', roomerRes.data);
  }

  // Hacer login con el nuevo Roomer
  const roomerToken = await loginUser(roomerEmail);

  // 5. Roomer intenta crear un Roomer (Debe fallar)
  const fakeRoomerRes = await createUser(roomerToken, buildingId, {
    email: `falso-${Date.now()}@test.com`,
    firstName: 'Roomer',
    lastName: 'Fake',
    password: 'password123',
    roleName: 'Roomer'
  });

  if (fakeRoomerRes.status === 403) {
    console.log('✅ Éxito: Roomer fue bloqueado al crear un usuario.');
  } else {
    console.log('❌ Falló: Roomer pudo crear o dio otro error:', fakeRoomerRes.data);
  }

  console.log('\n--- Test finalizado ---');
}

main().catch(console.error);
