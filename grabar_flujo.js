import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function grabarFlujoRestaurante() {
  const videoDir = path.resolve('./videos_flujo');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false, // se puede observar la interacción
    slowMo: 600       // ritmo humano fluido y visible
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 }
    }
  });

  const page = await context.newPage();

  console.log('1. Navegando al POS de MAREJADA...');
  await page.goto('http://127.0.0.1:5173');
  await page.waitForTimeout(1500);

  // LOGIN POR PIN
  console.log('2. Ingresando con usuario emilio y PIN 1234...');
  const userInput = page.locator('input[placeholder*="emilio"]');
  if (await userInput.isVisible()) {
    await userInput.fill('emilio');
    await page.waitForTimeout(500);

    // Teclear 1, 2, 3, 4 en el teclado táctil
    for (const d of ['1', '2', '3', '4']) {
      await page.locator(`button:has-text("${d}")`).first().click();
      await page.waitForTimeout(250);
    }
  }

  await page.waitForTimeout(2000);

  // Apertura de turno si aparece modal
  const btnEmpezarTurno = page.locator('button:has-text("Abrir Turno y Empezar")');
  if (await btnEmpezarTurno.isVisible()) {
    console.log('3. Aperturando turno con fondo inicial...');
    await btnEmpezarTurno.click();
    await page.waitForTimeout(1500);
  }

  // --- ESCENARIO: MESA 4 LLEGA Y PIDE ---
  console.log('4. Llega la Mesa 4...');
  // Abrir selector de mesa
  await page.locator('button:has(span:text-is("Mesa"))').first().click();
  await page.waitForTimeout(1000);

  // Seleccionar Mesa 4 en el modal
  await page.locator('button[data-mesa="4"]').click();
  await page.waitForTimeout(1000);

  // Agregar platillos y tragos para Mesa 4
  console.log('   -> Agregando productos a Mesa 4...');
  const btnAgregar = page.locator('button:has-text("Agregar")');
  await btnAgregar.nth(0).click(); // Corona
  await page.waitForTimeout(600);
  await btnAgregar.nth(0).click(); // Otra Corona
  await page.waitForTimeout(600);
  await btnAgregar.nth(1).click(); // Victoria o Platillo
  await page.waitForTimeout(1000);

  // Guardar en Cuenta Abierta para Mesa 4
  console.log('   -> Guardando en Cuenta Abierta (Mesa 4)...');
  await page.locator('button:has-text("Guardar en Cuenta Abierta")').click();
  await page.waitForTimeout(2500);

  // --- ESCENARIO: LLEGA MESA 8 Y PIDE ---
  console.log('5. Llega la Mesa 8...');
  await page.locator('button:has(span:text-is("Mesa"))').first().click();
  await page.waitForTimeout(1000);

  // Seleccionar Mesa 8
  await page.locator('button[data-mesa="8"]').click();
  await page.waitForTimeout(1000);

  // Comprobar que la comanda anterior de Mesa 4 se aisló limpiamente
  console.log('   -> Comanda aislada en blanco. Agregando productos a Mesa 8...');
  await btnAgregar.nth(2).click(); // Destilado
  await page.waitForTimeout(600);
  await btnAgregar.nth(3).click(); // Mezcal
  await page.waitForTimeout(1000);

  // Guardar en Cuenta Abierta para Mesa 8
  console.log('   -> Guardando en Cuenta Abierta (Mesa 8)...');
  await page.locator('button:has-text("Guardar en Cuenta Abierta")').click();
  await page.waitForTimeout(2500);

  // --- VER CUENTAS ABIERTAS ACTIVAS ---
  console.log('6. Consultando todas las Cuentas Abiertas en servicio...');
  await page.locator('button:has-text("Cuentas Abiertas")').click();
  await page.waitForTimeout(3000);

  // --- MESA 4 PIDE LA CUENTA Y PAGA CON TARJETA + PROPINA ---
  console.log('7. Mesa 4 pide la cuenta. Cargando su comanda...');
  await page.locator('div[data-cuenta-mesa="Mesa 4"]').first().click();
  await page.waitForTimeout(2000);

  console.log('   -> Cobrando Mesa 4 con Tarjeta + Propina (15%)...');
  await page.locator('button:has-text("Cobrar con Tarjeta")').click();
  await page.waitForTimeout(1500);

  // Seleccionar 15% de propina
  await page.locator('button:has-text("15%")').click();
  await page.waitForTimeout(1000);

  // Ingresar los 4 dígitos de cotejo (ej: 4, 8, 2, 6)
  for (const d of ['4', '8', '2', '6']) {
    await page.locator(`button:has-text("${d}")`).last().click();
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1000);

  // Confirmar cobro
  await page.locator('button:has-text("Confirmar e Imprimir")').click();
  await page.waitForTimeout(3000);

  // Cerrar vista de ticket impreso
  await page.locator('button:has-text("Finalizar Venta")').click();
  await page.waitForTimeout(2000);

  // --- MESA 8 PIDE LA CUENTA Y PAGA EN EFECTIVO ---
  console.log('8. Mesa 8 pide la cuenta. Abriendo módulo de cuentas...');
  await page.locator('button:has-text("Cuentas Abiertas")').click();
  await page.waitForTimeout(1500);

  await page.locator('div[data-cuenta-mesa="Mesa 8"]').first().click();
  await page.waitForTimeout(2000);

  console.log('   -> Cobrando Mesa 8 en Efectivo...');
  await page.locator('button:has-text("Cobro en Efectivo / Cambio")').click();
  await page.waitForTimeout(1500);

  // Seleccionar propina 10%
  await page.locator('button:has-text("10%")').click();
  await page.waitForTimeout(1000);

  // Pagar con billete rápido de $500 o $1000 para ver cálculo de cambio en vivo
  await page.locator('button:has-text("$500")').click();
  await page.waitForTimeout(2000);

  // Scroll into view if needed and confirm cobro
  const btnConfirmar = page.locator('button:has-text("Confirmar e Imprimir")');
  await btnConfirmar.scrollIntoViewIfNeeded();
  await btnConfirmar.click();
  await page.waitForTimeout(3500);

  // Finalizar venta
  await page.locator('button:has-text("Finalizar Venta")').click();
  await page.waitForTimeout(2000);

  // Verificar que ya no hay cuentas abiertas
  await page.locator('button:has-text("Cuentas Abiertas")').click();
  await page.waitForTimeout(2500);

  await context.close();
  await browser.close();

  const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const videoOriginal = path.join(videoDir, files[files.length - 1]);
    const videoFinal = path.resolve('./flujo_restaurante_marejada.webm');
    fs.copyFileSync(videoOriginal, videoFinal);
    console.log(`\n>>> VIDEO DEL FLUJO GENERADO CON ÉXITO: ${videoFinal} <<<`);
  }
}

grabarFlujoRestaurante().catch(err => {
  console.error("Error al grabar video:", err);
  process.exit(1);
});
