/**
 * ═══════════════════════════════════════════════════════════
 *  Clasificación de Niza — 45 clases + sugerencia por keywords
 * ═══════════════════════════════════════════════════════════
 */

const NIZA = (() => {
    const CLASES = [
        { n: 1, titulo: "Productos químicos industriales", kw: "quimico industrial fertilizante adhesivo resina" },
        { n: 2, titulo: "Pinturas y barnices", kw: "pintura barniz tinte colorante anticorrosivo" },
        { n: 3, titulo: "Cosméticos y limpieza", kw: "cosmetico perfume jabon shampoo limpieza belleza maquillaje" },
        { n: 4, titulo: "Aceites industriales y combustibles", kw: "aceite combustible lubricante vela cera" },
        { n: 5, titulo: "Productos farmacéuticos", kw: "farmaceutico medicamento suplemento vitamina veterinario" },
        { n: 6, titulo: "Metales comunes", kw: "metal aluminio acero hierro construccion herraje" },
        { n: 7, titulo: "Máquinas y herramientas mecánicas", kw: "maquina motor herramienta industrial mecanica" },
        { n: 8, titulo: "Herramientas manuales", kw: "herramienta manual cuchillo cubierto navaja" },
        { n: 9, titulo: "Software, electrónica y tecnología", kw: "software app aplicacion tecnologia electronico computadora celular programa plataforma digital web sistema saas online sitio pagina" },
        { n: 10, titulo: "Instrumental médico", kw: "medico quirurgico instrumental ortopedico protesis" },
        { n: 11, titulo: "Iluminación, calefacción, aire acondicionado", kw: "iluminacion luz calefaccion aire acondicionado refrigeracion" },
        { n: 12, titulo: "Vehículos", kw: "vehiculo auto moto bicicleta transporte automotor" },
        { n: 13, titulo: "Armas de fuego", kw: "arma fuego municion explosivo" },
        { n: 14, titulo: "Joyería y relojería", kw: "joya reloj oro plata bijouterie" },
        { n: 15, titulo: "Instrumentos musicales", kw: "instrumento musical guitarra piano" },
        { n: 16, titulo: "Papel, imprenta y librería", kw: "papel imprenta libro revista fotografia librería" },
        { n: 17, titulo: "Caucho y aislantes", kw: "caucho goma aislante plastico semielaborado" },
        { n: 18, titulo: "Cuero y marroquinería", kw: "cuero cartera mochila valija marroquineria" },
        { n: 19, titulo: "Materiales de construcción", kw: "construccion cemento ladrillo material obra" },
        { n: 20, titulo: "Muebles", kw: "mueble sillon mesa silla decoracion hogar" },
        { n: 21, titulo: "Utensilios domésticos y vidrio", kw: "utensilio cocina vajilla vidrio ceramica" },
        { n: 22, titulo: "Cuerdas y lonas", kw: "cuerda lona toldo carpa embalaje textil bruto" },
        { n: 23, titulo: "Hilos textiles", kw: "hilo textil hilado" },
        { n: 24, titulo: "Textiles y ropa de cama", kw: "textil tela sabana toalla mantel" },
        { n: 25, titulo: "Ropa, calzado y sombrerería", kw: "ropa indumentaria calzado zapatilla sombrero moda vestimenta remera pantalon" },
        { n: 26, titulo: "Encajes y artículos de mercería", kw: "encaje boton cierre mercería cinta" },
        { n: 27, titulo: "Alfombras y revestimientos de piso", kw: "alfombra piso revestimiento tapiz" },
        { n: 28, titulo: "Juegos y juguetes, artículos deportivos", kw: "juguete juego deporte gimnasio fitness recreacion" },
        { n: 29, titulo: "Carnes, pescados, alimentos procesados", kw: "carne pescado lacteo fiambre alimento procesado conserva" },
        { n: 30, titulo: "Café, panificados, condimentos, dulces", kw: "cafe pan panaderia pasteleria dulce chocolate condimento harina helado pizza torta postre" },
        { n: 31, titulo: "Productos agrícolas y animales vivos", kw: "agricola semilla planta animal vivo fruta verdura fresca mascota" },
        { n: 32, titulo: "Cervezas y bebidas sin alcohol", kw: "cerveza bebida gaseosa jugo agua mineral sin alcohol" },
        { n: 33, titulo: "Bebidas alcohólicas", kw: "vino whisky alcohol licor bebida alcoholica" },
        { n: 34, titulo: "Tabaco y artículos para fumadores", kw: "tabaco cigarrillo fumador vapeador" },
        { n: 35, titulo: "Publicidad y gestión comercial", kw: "publicidad marketing venta comercio negocio gestion empresarial administracion tienda retail comercializacion distribucion importacion exportacion agencia" },
        { n: 36, titulo: "Seguros y finanzas", kw: "seguro finanza banco inmobiliaria alquiler inversion credito inmueble propiedad tasacion loteo fideicomiso corredor broker" },
        { n: 37, titulo: "Construcción y reparación", kw: "construccion reparacion obra instalacion mantenimiento plomeria electricidad" },
        { n: 38, titulo: "Telecomunicaciones", kw: "telecomunicacion internet telefonia streaming transmision" },
        { n: 39, titulo: "Transporte y logística", kw: "transporte logistica envio delivery flete viaje turismo mudanza" },
        { n: 40, titulo: "Tratamiento de materiales", kw: "tratamiento material fabricacion a medida impresion 3d" },
        { n: 41, titulo: "Educación y entretenimiento", kw: "educacion capacitacion curso entretenimiento evento musica deporte cultura enseñanza academia colegio universidad taller produccion musical" },
        { n: 42, titulo: "Servicios tecnológicos y de diseño", kw: "software desarrollo diseño ingenieria tecnologia investigacion cientifico web plataforma saas hosting programacion" },
        { n: 43, titulo: "Restaurantes y hospedaje", kw: "restaurante bar hotel hospedaje gastronomia cafeteria alojamiento resto parrilla panaderia comida" },
        { n: 44, titulo: "Servicios médicos y de belleza", kw: "medico salud belleza estetica peluqueria spa veterinario clinica" },
        { n: 45, titulo: "Servicios legales y de seguridad", kw: "legal juridico abogado seguridad procuracion notarial escribania estudio gestoria tramite sucesion marca patente" },
    ];

    function sugerir(descripcion, top = 6) {
        const texto = descripcion.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // sin acentos
        const palabras = texto.split(/[\s,.]+/).filter(w => w.length > 2);
        const puntajes = CLASES.map(c => {
            let score = 0;
            const kwList = c.kw.split(' ');
            for (const p of palabras) {
                for (const kw of kwList) {
                    if (kw === p) score += 3;               // palabra exacta: peso alto
                    else if (kw.includes(p) || p.includes(kw)) score += 1; // parcial: peso bajo
                }
            }
            return { ...c, score };
        });
        return puntajes.filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, top);
    }

    function porNumero(n) {
        return CLASES.find(c => c.n === n);
    }

    return { CLASES, sugerir, porNumero };
})();
