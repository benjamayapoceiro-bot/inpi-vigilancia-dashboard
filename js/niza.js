/**
 * ═══════════════════════════════════════════════════════════
 *  Clasificación de Niza — 45 clases, basado en el texto oficial
 *  del INPI (Resolución 108/2016, 11ª Edición del Arreglo de Niza).
 *  Encabezados y notas condensados a partir de la fuente oficial
 *  (no es copia textual del articulado, es un resumen operativo
 *  para uso interno del estudio).
 * ═══════════════════════════════════════════════════════════
 */

const NIZA = (() => {
    const CLASES = [
        { n: 1, titulo: "Productos químicos industriales, científicos y agrícolas", incluye: "Químicos para industria/ciencia/agricultura, resinas y plásticos en bruto, abonos, adhesivos industriales.", kw: "quimico industrial cientifico agricola resina plastico bruto abono fertilizante adhesivo industrial curtiente" },
        { n: 2, titulo: "Pinturas, barnices y productos anticorrosivos", incluye: "Pinturas, barnices, lacas, tintes, colorantes, metales en polvo/hoja para pintura o imprenta.", kw: "pintura barniz laca tinte colorante anticorrosivo mordiente" },
        { n: 3, titulo: "Cosmética, perfumería y limpieza no medicinal", incluye: "Jabones, perfumes, cosméticos, productos de limpieza y tocador no medicinales.", kw: "cosmetico perfume jabon shampoo limpieza belleza maquillaje perfumeria tocador desodorante" },
        { n: 4, titulo: "Aceites industriales, lubricantes y combustibles", incluye: "Aceites y grasas industriales, lubricantes, combustibles, velas.", kw: "aceite industrial combustible lubricante vela mecha nafta gasolina" },
        { n: 5, titulo: "Productos farmacéuticos y de uso médico/veterinario", incluye: "Medicamentos, suplementos, productos sanitarios, desinfectantes, alimentos para bebés.", kw: "farmaceutico medicamento suplemento vitamina veterinario desinfectante sanitario" },
        { n: 6, titulo: "Metales comunes y productos metálicos", incluye: "Metales en bruto, materiales de construcción metálicos, ferretería metálica.", kw: "metal aluminio acero hierro construccion herraje ferreteria" },
        { n: 7, titulo: "Máquinas y máquinas-herramientas", incluye: "Máquinas industriales, motores (excepto vehículos), instrumentos agrícolas motorizados.", kw: "maquina motor herramienta industrial mecanica maquinaria" },
        { n: 8, titulo: "Herramientas e instrumentos manuales", incluye: "Herramientas de mano, cuchillería, tenedores y cucharas, máquinas de afeitar.", kw: "herramienta manual cuchillo cubierto navaja cuchilleria" },
        { n: 9, titulo: "Software, electrónica, informática y tecnología", incluye: "Software, apps, hardware informático, aparatos de medición/grabación, celulares, extintores.", kw: "software app aplicacion tecnologia electronico computadora celular programa plataforma digital web sistema saas online sitio pagina informatico hardware" },
        { n: 10, titulo: "Instrumental médico, quirúrgico y ortopédico", incluye: "Aparatos médicos/quirúrgicos/dentales/veterinarios, prótesis, artículos ortopédicos.", kw: "medico quirurgico instrumental ortopedico protesis dental odontologico" },
        { n: 11, titulo: "Iluminación, climatización e instalaciones sanitarias", incluye: "Alumbrado, calefacción, refrigeración, ventilación, distribución de agua, sanitarios.", kw: "iluminacion luz calefaccion aire acondicionado refrigeracion ventilacion sanitario" },
        { n: 12, titulo: "Vehículos y aparatos de locomoción", incluye: "Vehículos terrestres, aéreos y acuáticos, y sus partes.", kw: "vehiculo auto moto bicicleta transporte automotor camion" },
        { n: 13, titulo: "Armas de fuego y pirotecnia", incluye: "Armas de fuego, municiones, explosivos, fuegos artificiales.", kw: "arma fuego municion explosivo pirotecnia" },
        { n: 14, titulo: "Metales preciosos, joyería y relojería", incluye: "Joyas, piedras preciosas, relojes, artículos de metales preciosos.", kw: "joya reloj oro plata bijouterie joyeria relojeria" },
        { n: 15, titulo: "Instrumentos musicales", incluye: "Instrumentos musicales de todo tipo, incluidos eléctricos/electrónicos.", kw: "instrumento musical guitarra piano bateria" },
        { n: 16, titulo: "Papel, imprenta, librería y material didáctico", incluye: "Papel, cartón, productos de imprenta, artículos de librería y oficina, material didáctico.", kw: "papel imprenta libro revista fotografia libreria oficina papeleria material didactico cuaderno" },
        { n: 17, titulo: "Caucho, plásticos semielaborados y aislantes", incluye: "Caucho, materias plásticas semielaboradas, materiales aislantes, tubos flexibles no metálicos.", kw: "caucho goma aislante plastico semielaborado" },
        { n: 18, titulo: "Cuero, marroquinería y artículos de viaje", incluye: "Cuero, valijas, carteras, mochilas, paraguas, artículos para animales (correas, collares).", kw: "cuero cartera mochila valija marroquineria equipaje bolso" },
        { n: 19, titulo: "Materiales de construcción no metálicos", incluye: "Materiales de construcción no metálicos, asfalto, maderas semielaboradas, vidrio de construcción.", kw: "construccion cemento ladrillo material obra no metalico" },
        { n: 20, titulo: "Muebles y artículos de mobiliario", incluye: "Muebles, espejos, marcos, colchones, artículos de madera/corcho/plástico no clasificados en otra clase.", kw: "mueble sillon mesa silla decoracion hogar colchon" },
        { n: 21, titulo: "Utensilios domésticos, cristalería y cerámica", incluye: "Utensilios de cocina/hogar accionados a mano, cristalería, porcelana, loza, cepillos.", kw: "utensilio cocina vajilla vidrio ceramica cristaleria" },
        { n: 22, titulo: "Cuerdas, lonas, toldos y textiles brutos", incluye: "Cuerdas, redes, tiendas de campaña, lonas, materias textiles fibrosas en bruto.", kw: "cuerda lona toldo carpa embalaje textil bruto" },
        { n: 23, titulo: "Hilos para uso textil", incluye: "Hilos textiles de todo tipo.", kw: "hilo textil hilado" },
        { n: 24, titulo: "Tejidos y ropa de hogar", incluye: "Telas, ropa de cama, cortinas de materia textil.", kw: "textil tela sabana toalla mantel cortina" },
        { n: 25, titulo: "Ropa, calzado y sombrerería", incluye: "Prendas de vestir, calzado, artículos de sombrerería.", kw: "ropa indumentaria calzado zapatilla sombrero moda vestimenta remera pantalon vestido" },
        { n: 26, titulo: "Mercería, encajes y adornos para el cabello", incluye: "Encajes, botones, cierres, cintas, flores artificiales, pelucas y adornos capilares.", kw: "encaje boton cierre merceria cinta peluca" },
        { n: 27, titulo: "Alfombras y revestimientos de piso", incluye: "Alfombras, felpudos, linóleo y otros revestimientos de suelos o paredes (no textiles murales).", kw: "alfombra piso revestimiento tapiz" },
        { n: 28, titulo: "Juegos, juguetes y artículos deportivos", incluye: "Juguetes, videojuegos, artículos de gimnasia y deporte, adornos navideños.", kw: "juguete juego deporte gimnasio fitness recreacion videojuego" },
        { n: 29, titulo: "Alimentos de origen animal y conservas", incluye: "Carnes, pescados, lácteos, frutas/verduras en conserva, huevos, aceites comestibles.", kw: "carne pescado lacteo fiambre alimento procesado conserva queso yogur" },
        { n: 30, titulo: "Café, panificados, condimentos y golosinas", incluye: "Café, té, harinas, pan, pastelería, helados, azúcar, salsas, especias.", kw: "cafe pan panaderia pasteleria dulce chocolate condimento harina helado pizza torta postre golosina" },
        { n: 31, titulo: "Productos agrícolas frescos y animales vivos", incluye: "Granos y frutas/verduras frescas sin procesar, plantas, animales vivos, alimento para animales.", kw: "agricola semilla planta animal vivo fruta verdura fresca mascota alimento balanceado" },
        { n: 32, titulo: "Cervezas y bebidas sin alcohol", incluye: "Cervezas, aguas minerales, gaseosas, jugos de fruta, jarabes para bebidas.", kw: "cerveza bebida gaseosa jugo agua mineral sin alcohol" },
        { n: 33, titulo: "Bebidas alcohólicas (excepto cerveza)", incluye: "Vinos, licores, destilados y demás bebidas alcohólicas.", kw: "vino whisky alcohol licor bebida alcoholica fernet" },
        { n: 34, titulo: "Tabaco y artículos para fumadores", incluye: "Tabaco, cigarrillos, cerillas, artículos para fumadores.", kw: "tabaco cigarrillo fumador vapeador cigarro" },
        { n: 35, titulo: "Publicidad, gestión y administración comercial", incluye: "Publicidad, gestión de negocios, administración comercial, venta minorista/mayorista, agrupamiento de productos para su venta.", kw: "publicidad marketing venta comercio negocio gestion empresarial administracion tienda retail comercializacion distribucion importacion exportacion agencia ecommerce" },
        { n: 36, titulo: "Seguros, finanzas y negocios inmobiliarios", incluye: "Seguros, operaciones financieras y monetarias, bancos, negocios inmobiliarios (alquiler, tasación, administración de propiedades).", kw: "seguro finanza banco inmobiliaria alquiler inversion credito inmueble propiedad tasacion loteo fideicomiso corredor broker" },
        { n: 37, titulo: "Construcción, reparación e instalación", incluye: "Construcción de edificios/obras, reparación de objetos, instalaciones (plomería, calefacción, techado).", kw: "construccion reparacion obra instalacion mantenimiento plomeria electricidad techado" },
        { n: 38, titulo: "Telecomunicaciones", incluye: "Servicios de comunicación entre personas: telefonía, transmisión de mensajes, radio y TV.", kw: "telecomunicacion internet telefonia streaming transmision radio television" },
        { n: 39, titulo: "Transporte, embalaje, almacenamiento y viajes", incluye: "Transporte de personas/mercaderías, embalaje y almacenamiento, organización de viajes.", kw: "transporte logistica envio delivery flete viaje turismo mudanza almacenamiento embalaje" },
        { n: 40, titulo: "Tratamiento y transformación de materiales", incluye: "Procesamiento/transformación de objetos o sustancias por encargo de terceros, fabricación a medida.", kw: "tratamiento material fabricacion a medida impresion 3d transformacion" },
        { n: 41, titulo: "Educación, formación, entretenimiento y cultura", incluye: "Educación, capacitación, entretenimiento, actividades deportivas y culturales.", kw: "educacion capacitacion curso entretenimiento evento musica deporte cultura enseñanza academia colegio universidad taller produccion musical formacion" },
        { n: 42, titulo: "Servicios científicos, tecnológicos y de diseño/software", incluye: "Investigación y diseño científico/tecnológico, análisis industrial, desarrollo de software y hardware, servicios de arquitectura y decoración de interiores.", kw: "software desarrollo diseño ingenieria tecnologia investigacion cientifico web plataforma saas hosting programacion desarrollo web arquitectura decoracion decorador interiorismo interiores interior ambientacion diseñador" },
        { n: 43, titulo: "Restauración (gastronomía) y hospedaje temporal", incluye: "Servicios de comida y bebida, alojamiento temporal (hoteles, pensiones).", kw: "restaurante bar hotel hospedaje gastronomia cafeteria alojamiento resto parrilla panaderia comida" },
        { n: 44, titulo: "Servicios médicos, de belleza y agropecuarios", incluye: "Servicios médicos/veterinarios, tratamientos de higiene y belleza, agricultura/horticultura/silvicultura.", kw: "medico salud belleza estetica peluqueria spa veterinario clinica jardineria" },
        { n: 45, titulo: "Servicios jurídicos, de seguridad y personales", incluye: "Servicios legales, seguridad física de bienes/personas, servicios personales y sociales (ej. agencias matrimoniales, funerarios).", kw: "legal juridico abogado seguridad procuracion notarial escribania estudio gestoria tramite sucesion marca patente" },
    ];

    function porNumero(n) {
        return CLASES.find(c => c.n === n);
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
                    else if (kw.includes(p) || p.includes(kw)) score += 1;
                }
            }
            return { ...c, score };
        });

        let resultado = puntajes.filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, top);

        // Garantía: siempre al menos `minimo` clases, aunque el keyword-match
        // no encuentre suficientes. Clase 35 (publicidad/comercialización)
        // es casi siempre relevante para cualquier actividad comercial, así
        // que se usa como candidata de respaldo antes de rellenar al azar.
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
