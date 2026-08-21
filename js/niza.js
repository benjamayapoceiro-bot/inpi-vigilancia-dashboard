/**
 * ═══════════════════════════════════════════════════════════
 *  Clasificación de Niza — 45 clases, basado en el texto oficial
 *  del INPI (Resolución 108/2016, 11ª Edición del Arreglo de Niza).
 *  Encabezados y notas condensados a partir de la fuente oficial
 *  (no es copia textual del articulado, es un resumen operativo
 *  para uso interno del estudio, con vocabulario ampliado desde
 *  las notas explicativas reales de "esta clase comprende...").
 * ═══════════════════════════════════════════════════════════
 */

const NIZA = (() => {
    const CLASES = [
        { n: 1, titulo: "Productos químicos industriales, científicos y agrícolas", incluye: "Químicos para industria/ciencia/agricultura/horticultura/silvicultura, resinas y plásticos en bruto, abonos, adhesivos industriales, compost, materias curtientes.", kw: "quimico industrial cientifico agricola horticultura silvicultura resina plastico bruto abono fertilizante compost organico adhesivo industrial curtiente extintora templar soldar" },
        { n: 2, titulo: "Pinturas, barnices y productos anticorrosivos", incluye: "Pinturas, barnices, lacas, tintes, colorantes, productos contra herrumbre y deterioro de madera, metales en polvo/hoja para pintura o imprenta.", kw: "pintura barniz laca tinte colorante anticorrosivo mordiente herrumbre tintorea imprenta trabajos artisticos" },
        { n: 3, titulo: "Cosmética, perfumería y limpieza no medicinal", incluye: "Jabones, perfumes, cosméticos, lociones capilares, dentífricos, productos de limpieza y tocador no medicinales, desodorantes.", kw: "cosmetico perfume jabon shampoo limpieza belleza maquillaje perfumeria tocador desodorante lociones capilares dentifrico higiene personal blanquear" },
        { n: 4, titulo: "Aceites industriales, lubricantes y combustibles", incluye: "Aceites y grasas industriales, lubricantes, combustibles (incluida nafta), materiales de alumbrado, velas y mechas.", kw: "aceite industrial combustible lubricante vela mecha nafta gasolina alumbrado" },
        { n: 5, titulo: "Productos farmacéuticos y de uso médico/veterinario", incluye: "Medicamentos, suplementos, productos sanitarios, desinfectantes, alimentos para bebés, pañales, champús medicinales.", kw: "farmaceutico medicamento suplemento vitamina veterinario desinfectante sanitario panal incontinente champu medicinal fungicida herbicida" },
        { n: 6, titulo: "Metales comunes y productos metálicos", incluye: "Metales en bruto, materiales de construcción metálicos, ferretería metálica, cables, recipientes de almacenamiento.", kw: "metal aluminio acero hierro construccion herraje ferreteria cable recipiente almacenamiento" },
        { n: 7, titulo: "Máquinas y máquinas-herramientas", incluye: "Máquinas industriales, motores (excepto vehículos), instrumentos agrícolas motorizados, incubadoras, distribuidores automáticos.", kw: "maquina motor herramienta industrial mecanica maquinaria incubadora distribuidor automatico" },
        { n: 8, titulo: "Herramientas e instrumentos manuales", incluye: "Herramientas de mano, cuchillería, tenedores y cucharas, armas blancas, máquinas de afeitar.", kw: "herramienta manual cuchillo cubierto navaja cuchilleria arma blanca afeitar" },
        { n: 9, titulo: "Software, electrónica, informática y tecnología", incluye: "Software, apps, hardware informático, aparatos de medición/grabación/señalización/control, celulares, ordenadores, extintores.", kw: "software app aplicacion tecnologia electronico computadora celular programa plataforma digital web sistema saas online sitio pagina informatico hardware ordenador medicion grabacion senalizacion control" },
        { n: 10, titulo: "Instrumental médico, quirúrgico y ortopédico", incluye: "Aparatos médicos/quirúrgicos/dentales/veterinarios, prótesis, artículos ortopédicos, dispositivos de puericultura.", kw: "medico quirurgico instrumental ortopedico protesis dental odontologico sutura puericultura discapacitadas" },
        { n: 11, titulo: "Iluminación, climatización e instalaciones sanitarias", incluye: "Alumbrado, calefacción, producción de vapor, cocción, refrigeración, secado, ventilación, distribución de agua, aire acondicionado.", kw: "iluminacion luz calefaccion aire acondicionado refrigeracion ventilacion sanitario vapor coccion secado" },
        { n: 12, titulo: "Vehículos y aparatos de locomoción", incluye: "Vehículos terrestres, aéreos y acuáticos, y sus partes.", kw: "vehiculo auto moto bicicleta transporte automotor camion locomocion" },
        { n: 13, titulo: "Armas de fuego y pirotecnia", incluye: "Armas de fuego, municiones, proyectiles, explosivos, fuegos artificiales.", kw: "arma fuego municion explosivo pirotecnia proyectil" },
        { n: 14, titulo: "Metales preciosos, joyería y relojería", incluye: "Joyas, piedras preciosas y semipreciosas, relojes, instrumentos cronométricos, artículos de bisutería.", kw: "joya reloj oro plata bijouterie joyeria relojeria bisuteria cronometrico" },
        { n: 15, titulo: "Instrumentos musicales", incluye: "Instrumentos musicales de todo tipo, incluidos eléctricos/electrónicos, pianos mecánicos, cajas de música.", kw: "instrumento musical guitarra piano bateria" },
        { n: 16, titulo: "Papel, imprenta, librería y material didáctico", incluye: "Papel, cartón, productos de imprenta, artículos de librería/oficina, material didáctico y de dibujo, adhesivos de papelería.", kw: "papel imprenta libro revista fotografia libreria oficina papeleria material didactico cuaderno dibujo pincel encuadernacion" },
        { n: 17, titulo: "Caucho, plásticos semielaborados y aislantes", incluye: "Caucho, materias plásticas semielaboradas, materiales aislantes eléctricos/térmicos/acústicos, tubos flexibles no metálicos.", kw: "caucho goma aislante plastico semielaborado gutapercha amianto mica calafatear estopar" },
        { n: 18, titulo: "Cuero, marroquinería y artículos de viaje", incluye: "Cuero, valijas, carteras, mochilas, paraguas, bastones, arneses, collares y correas para animales.", kw: "cuero cartera mochila valija marroquineria equipaje bolso paraguas arnes fusta" },
        { n: 19, titulo: "Materiales de construcción no metálicos", incluye: "Materiales de construcción no metálicos, asfalto, maderas semielaboradas, vidrio de construcción, monumentos no metálicos.", kw: "construccion cemento ladrillo material obra no metalico asfalto monumento" },
        { n: 20, titulo: "Muebles y artículos de mobiliario", incluye: "Muebles, espejos, marcos, colchones, contenedores no metálicos, hueso/cuerno/nácar en bruto, persianas de interior.", kw: "mueble sillon mesa silla decoracion hogar colchon espejo marco persiana" },
        { n: 21, titulo: "Utensilios domésticos, cristalería y cerámica", incluye: "Utensilios de cocina/hogar accionados a mano, cristalería, porcelana, loza, peines, esponjas y cepillos.", kw: "utensilio cocina vajilla vidrio ceramica cristaleria peine esponja cepillo" },
        { n: 22, titulo: "Cuerdas, lonas, toldos y textiles brutos", incluye: "Cuerdas, redes, tiendas de campaña, lonas, velas de navegación, sacos, materias textiles fibrosas en bruto.", kw: "cuerda lona toldo carpa embalaje textil bruto red vela navegacion saco" },
        { n: 23, titulo: "Hilos para uso textil", incluye: "Hilos textiles de todo tipo.", kw: "hilo textil hilado" },
        { n: 24, titulo: "Tejidos y ropa de hogar", incluye: "Telas, ropa de cama, cortinas de materia textil o plástica, colchas, toallas.", kw: "textil tela sabana toalla mantel cortina colcha" },
        { n: 25, titulo: "Ropa, calzado y sombrerería", incluye: "Prendas de vestir, calzado, artículos de sombrerería.", kw: "ropa indumentaria calzado zapatilla sombrero moda vestimenta remera pantalon vestido" },
        { n: 26, titulo: "Mercería, encajes y adornos para el cabello", incluye: "Encajes, bordados, cintas, botones, cierres, alfileres, flores artificiales, pelucas y adornos capilares.", kw: "encaje boton cierre merceria cinta peluca bordado cordon pasamaneria" },
        { n: 27, titulo: "Alfombras y revestimientos de piso", incluye: "Alfombras, felpudos, esteras, linóleo y otros revestimientos de suelos, tapices murales no textiles.", kw: "alfombra piso revestimiento tapiz felpudo estera" },
        { n: 28, titulo: "Juegos, juguetes y artículos deportivos", incluye: "Juguetes, videojuegos, artículos de gimnasia y deporte, adornos navideños, material de caza y pesca.", kw: "juguete juego deporte gimnasio fitness recreacion videojuego caza pesca navidad" },
        { n: 29, titulo: "Alimentos de origen animal y conservas", incluye: "Carnes, pescados, aves, lácteos, frutas/verduras en conserva o congeladas, huevos, aceites comestibles.", kw: "carne pescado lacteo fiambre alimento procesado conserva queso yogur ave caza extracto jalea confitura compota" },
        { n: 30, titulo: "Café, panificados, condimentos y golosinas", incluye: "Café, té, cacao, arroz, harinas, pan, pastelería, helados, azúcar, sal, vinagre, salsas, especias.", kw: "cafe pan panaderia pasteleria dulce chocolate condimento harina helado pizza torta postre golosina cacao arroz azucar miel vinagre especia sal" },
        { n: 31, titulo: "Productos agrícolas frescos y animales vivos", incluye: "Granos y frutas/verduras frescas sin procesar, plantas y flores naturales, animales vivos, alimento para animales.", kw: "agricola semilla planta animal vivo fruta verdura fresca mascota alimento balanceado acuicola horticola forestal bulbo malta" },
        { n: 32, titulo: "Cervezas y bebidas sin alcohol", incluye: "Cervezas, aguas minerales, gaseosas, jugos de fruta, jarabes para bebidas.", kw: "cerveza bebida gaseosa jugo agua mineral sin alcohol zumo sirope" },
        { n: 33, titulo: "Bebidas alcohólicas (excepto cerveza)", incluye: "Vinos, licores, destilados y demás bebidas alcohólicas.", kw: "vino whisky alcohol licor bebida alcoholica fernet" },
        { n: 34, titulo: "Tabaco y artículos para fumadores", incluye: "Tabaco, cigarrillos, cerillas, artículos para fumadores, sucedáneos del tabaco.", kw: "tabaco cigarrillo fumador vapeador cigarro cerilla" },
        { n: 35, titulo: "Publicidad, gestión y administración comercial", incluye: "Publicidad, gestión de negocios, administración comercial, trabajos de oficina, venta minorista/mayorista, agrupamiento de productos, agencias publicitarias.", kw: "publicidad marketing venta comercio negocio gestion empresarial administracion tienda retail comercializacion distribucion importacion exportacion agencia ecommerce oficina folleto catalogo televenta" },
        { n: 36, titulo: "Seguros, finanzas y negocios inmobiliarios", incluye: "Seguros, operaciones financieras y monetarias, bancos, créditos, inversiones, negocios inmobiliarios, leasing, tasación.", kw: "seguro finanza banco inmobiliaria alquiler inversion credito inmueble propiedad tasacion loteo fideicomiso corredor broker leasing cartera bienes valores fiduciario" },
        { n: 37, titulo: "Construcción, reparación e instalación", incluye: "Construcción de edificios/obras, reparación de objetos, instalaciones (plomería, calefacción, techado, pintura).", kw: "construccion reparacion obra instalacion mantenimiento plomeria electricidad techado fontaneria naval" },
        { n: 38, titulo: "Telecomunicaciones", incluye: "Servicios de comunicación entre personas: telefonía, transmisión de mensajes, radio y TV, difusión de programas.", kw: "telecomunicacion internet telefonia streaming transmision radio television difusion" },
        { n: 39, titulo: "Transporte, embalaje, almacenamiento y viajes", incluye: "Transporte de personas/mercaderías, embalaje y almacenamiento, organización de viajes, alquiler de vehículos.", kw: "transporte logistica envio delivery flete viaje turismo mudanza almacenamiento embalaje remolque puerto muelle" },
        { n: 40, titulo: "Tratamiento y transformación de materiales", incluye: "Procesamiento/transformación de objetos o sustancias por encargo de terceros, fabricación a medida, corte, pulido, revestimiento.", kw: "tratamiento material fabricacion a medida impresion 3d transformacion corte pulido revestimiento tenido" },
        { n: 41, titulo: "Educación, formación, entretenimiento y cultura", incluye: "Educación, capacitación, entretenimiento, actividades deportivas y culturales, doma de animales.", kw: "educacion capacitacion curso entretenimiento evento musica deporte cultura enseñanza academia colegio universidad taller produccion musical formacion recreo diversion" },
        { n: 42, titulo: "Servicios científicos, tecnológicos y de diseño/software", incluye: "Investigación y diseño científico/tecnológico, análisis industrial, desarrollo de software y hardware, consultoría tecnológica, arquitectura y decoración de interiores.", kw: "software desarrollo diseño ingenieria tecnologia investigacion cientifico web plataforma saas hosting programacion desarrollo web arquitectura decoracion decorador interiorismo interiores interior ambientacion diseñador consultoria" },
        { n: 43, titulo: "Restauración (gastronomía) y hospedaje temporal", incluye: "Servicios de comida y bebida, alojamiento temporal (hoteles, pensiones), reserva de alojamiento, residencias para animales.", kw: "restaurante bar hotel hospedaje gastronomia cafeteria alojamiento resto parrilla panaderia comida albergue pension" },
        { n: 44, titulo: "Servicios médicos, de belleza y agropecuarios", incluye: "Servicios médicos/veterinarios, tratamientos de higiene y belleza, agricultura/horticultura/silvicultura, jardinería, arreglos florales.", kw: "medico salud belleza estetica peluqueria spa veterinario clinica jardineria cria animal cultivo planta floral paisajista inseminacion" },
        { n: 45, titulo: "Servicios jurídicos, de seguridad y personales", incluye: "Servicios legales, seguridad física de bienes/personas, servicios personales y sociales (agencias matrimoniales, funerarios).", kw: "legal juridico abogado seguridad procuracion notarial escribania estudio gestoria tramite sucesion marca patente jurista asesor vigilancia matrimonial funerario" },
    ];

    function porNumero(n) {
        return CLASES.find(c => c.n === n);
    }

    function coincidenRaiz(a, b) {
        // Compara si dos palabras comparten la misma raíz aproximada,
        // tolerando diferencias de largo típicas de singular/plural
        // (inmueble/inmuebles, flor/flores) sin reglas gramaticales fijas.
        if (a === b) return true;
        const minLen = Math.min(a.length, b.length);
        if (minLen < 4 || Math.abs(a.length - b.length) > 2) return false;
        return a.slice(0, minLen - 1) === b.slice(0, minLen - 1);
    }

    function sugerir(descripcion, top = 6, minimo = 2) {
        const texto = descripcion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const palabras = texto.split(/[\s,.]+/).filter(w => w.length > 2);
        const puntajes = CLASES.map(c => {
            let score = 0;
            const kwList = c.kw.split(' ');
            for (const p of palabras) {
                for (const kw of kwList) {
                    if (kw === p) score += 3;
                    else if (coincidenRaiz(kw, p)) score += 2;
                    else if (kw.includes(p) || p.includes(kw)) score += 1;
                }
            }
            return { ...c, score };
        });

        let resultado = puntajes.filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, top);

        if (resultado.length < minimo) {
            const yaElegidas = new Set(resultado.map(c => c.n));
            if (!yaElegidas.has(35)) {
                resultado.push({ ...porNumero(35), score: 0 });
                yaElegidas.add(35);
            }
            for (const c of [...puntajes].sort((a, b) => b.score - a.score)) {
                if (resultado.length >= minimo) break;
                if (!yaElegidas.has(c.n)) {
                    resultado.push(c);
                    yaElegidas.add(c.n);
                }
            }
        }

        return resultado;
    }

    return { CLASES, sugerir, porNumero };
})();
