#!/usr/bin/env node
/* Gera as páginas de venda dos ebooks (uma por material), no mesmo desenho da
   página do curso (/preparacao-familiar):
     /mochila-de-emergencia  → ebook-mochila-emergencia
     /comida-que-dura        → comida-que-dura
     /mochila-pet            → mochila-emergencia-pet
   Preço, link da Hubla, nome e imagem vêm de data/produtos.json; o texto de venda
   fica aqui embaixo, em PAGINAS.

   Uso, depois de editar este arquivo ou data/produtos.json:
     node scripts/gerar-paginas-ebooks.js && node scripts/gerar-paginas-loja.js */
"use strict";
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const SITE = "https://preparacaofamiliar.com.br";
const MARCA = "IDE Preparação Familiar";
const dados = JSON.parse(fs.readFileSync(path.join(RAIZ, "data/produtos.json"), "utf8"));
const produto = (slug) => {
  const p = dados.produtos.find((x) => x.slug === slug);
  if (!p) throw new Error("produto não encontrado em data/produtos.json: " + slug);
  return p;
};
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const preco = (p) => (p.preco_promo != null && p.preco_promo < p.preco ? p.preco_promo : p.preco);
const brl = (v) => v.toFixed(2).replace(".", ",");

/* ------------------------------------------------------------------ textos */
const PAGINAS = [
  {
    rota: "mochila-de-emergencia",
    slug: "ebook-mochila-emergencia",
    titulo: "Ebook Mochila de Emergência — o que levar e o que não levar | IDE",
    descricao: "Manual Operacional da Academia IDE, Volume 001: como montar, organizar e manter pronta a mochila de emergência da sua família. PDF por R$ 19,90.",
    kicker: "Manual Operacional Academia IDE · Volume 001",
    h1: "Se vocês tivessem que sair de casa em 10 minutos, o que iria na mochila?",
    sub: "O primeiro volume do Manual Operacional da Academia IDE mostra como montar a mochila de emergência da sua família: o que levar, o que deixar de fora, como organizar e como manter tudo pronto para sair rápido se for preciso.",
    stats: [["Vol. 001", "Manual operacional"], ["PDF", "Celular ou impresso"], ["Na hora", "Liberado na Hubla"]],
    problemaKicker: "O problema",
    problemaH2: "Na hora da pressa, ninguém pensa direito",
    problema: [
      "Enchente, incêndio, falta de energia prolongada, uma evacuação de última hora: quando é preciso sair de casa, não dá tempo de decidir o que levar. Quem não decidiu antes pega o que vê pela frente — e esquece o que faz falta.",
      "A mochila de emergência resolve isso com antecedência. Mas mochila cheia demais pesa, atrasa e cansa; mochila montada sem critério deixa de fora o essencial. O manual existe para você montar a sua uma vez, do jeito certo.",
    ],
    aprendeH2: "O que o manual ensina",
    aprende: [
      ["O que levar", "os itens que fazem diferença nas primeiras horas fora de casa."],
      ["O que não levar", "o que só ocupa espaço e peso e atrapalha na hora de sair."],
      ["Como organizar", "para achar cada coisa rápido, sem precisar despejar a mochila."],
      ["Como manter pronta", "para a mochila continuar útil meses depois de montada."],
    ],
    paraQuem: [
      "Famílias que querem estar prontas para sair de casa rápido, se for preciso.",
      "Quem já pensou em montar uma mochila de emergência e não sabia por onde começar.",
      "Quem já tem uma mochila e quer conferir se ela está completa e leve.",
    ],
    autoria: "Material da Academia IDE Bushcraft & Sobrevivência, de Alex e Andreia Moraes.",
    cta: "Quero o manual",
    faqExtra: [
      ["Preciso comprar equipamento caro?", "Não. O manual ajuda você a decidir o que é essencial — boa parte do que entra na mochila você já tem em casa."],
    ],
  },
  {
    rota: "comida-que-dura",
    slug: "comida-que-dura",
    titulo: "Comida que Dura — guia de armazenamento de alimentos | Andreia Moraes",
    descricao: "E-book + planilha de Andreia Moraes: como montar uma reserva de alimentos que dura meses e anos, no calor e na umidade do Brasil. 10 capítulos, 55 páginas. R$ 19,90.",
    kicker: "E-book + planilha · por Andreia Moraes",
    h1: "Se o mercado fechasse amanhã, quantos dias a sua casa aguentaria?",
    sub: "O guia prático de Andreia Moraes para montar uma reserva de alimentos que aguenta greve, enchente, apagão e mês apertado — com o método certo para o calor e a umidade do Brasil.",
    heroImg: { src: "/assets/produtos/comida/capa.webp", w: 960, h: 1440, alt: "Capa do e-book Comida que Dura, de Andreia Moraes", retrato: true },
    heroLista: [
      "Quais alimentos duram décadas e quais estragam em poucos meses na despensa",
      "Como um sachê barato faz o arroz branco passar de 1 ano para 25",
      "Um plano de 90 dias que começa com um item a mais em cada ida ao mercado",
    ],
    heroNota: "Pagamento único · Pix ou cartão · garantia de 7 dias",
    stats: [["10", "Capítulos práticos"], ["55", "Páginas para ler no celular"], ["Bônus", "Planilha da Reserva"]],
    linhaDoTempo: {
      kicker: "O que já aconteceu",
      h2: "O Brasil já mostrou o que acontece quando a comida some da prateleira",
      itens: [
        ["Maio de 2018", "Greve dos caminhoneiros", "Em poucos dias faltou gasolina nos postos, faltou verdura na feira e muita prateleira de supermercado ficou vazia."],
        ["Novembro de 2020", "Apagão no Amapá", "Quase todo o estado ficou no escuro, e a energia voltou em rodízio durante semanas. Geladeira desligada por tanto tempo é carne, leite e congelado indo para o lixo."],
        ["Maio de 2024", "Enchentes no Rio Grande do Sul", "As enchentes isolaram cidades inteiras, e bairros de Porto Alegre passaram dias sem água tratada."],
      ],
      fecho: [
        "Quem tinha comida guardada passou esses dias cozinhando como sempre. Quem não tinha passou os mesmos dias em fila.",
        "E há as crises que não saem no jornal: uma demissão no meio do mês, um familiar internado, um salário que atrasa. Nessas horas, abrir o armário e encontrar comida para semanas muda o jeito como a família atravessa o problema — o dinheiro do mercado pode pagar a luz, o remédio ou o aluguel.",
      ],
    },
    problemaKicker: "O erro comum",
    problemaH2: "Por que tanta gente tenta estocar comida e desiste",
    problema: [
      "A história costuma ser parecida. A pessoa vê uma promoção, compra vinte quilos de arroz e guarda no armário da área de serviço. Seis meses depois abre o pacote e encontra caruncho, cheiro de mofo ou grão grudado. Metade vai para o lixo junto com o dinheiro, e fica a impressão de que reserva de comida não funciona.",
      "O que estragou aquele arroz foi uma destas cinco coisas — e o clima quente e úmido do Brasil ajuda quase todas elas.",
    ],
    inimigos: {
      itens: [["Oxigênio", "Deixa a gordura rançosa."], ["Umidade", "Traz fungo, mofo e caruncho."], ["Calor", "Acelera todo o resto."], ["Luz", "Tira cor, vitamina e sabor."], ["Pragas", "Caruncho, traça e rato."]],
      fecho: "Quase todo desperdício de comida guardada tem uma dessas cinco causas, e cada uma tem uma defesa barata que cabe em casa.",
    },
    metodo: {
      kicker: "O método",
      h2: "Comida seca, com pouca gordura e guardada sem oxigênio dura anos",
      texto: [
        "O e-book ensina, passo a passo, a montar e manter uma reserva de comida e água para a sua família. Ele foi escrito para a realidade brasileira: arroz e feijão no centro do prato, apartamento pequeno, orçamento apertado e uma despensa que esquenta no verão.",
        "Um sachê absorvedor de oxigênio dentro de uma garrafa PET bem fechada leva o arroz branco de um ou dois anos na embalagem do mercado para 25 a 30 anos. O livro traz os números alimento por alimento, com o ajuste para o calor daqui.",
      ],
      compara: [["Na embalagem do mercado", "1 a 2 anos"], ["Na garrafa PET com sachê", "25 a 30 anos"]],
      fonte: "Arroz branco guardado. Prazos de pesquisas da Utah State University e da Brigham Young University, com a comida a 24 °C ou menos.",
      paginas: [
        ["/assets/produtos/comida/pagina-04.webp", "Página do sumário do e-book"],
        ["/assets/produtos/comida/pagina-15.webp", "Página com a tabela de durabilidade dos alimentos"],
        ["/assets/produtos/comida/pagina-51.webp", "Página com o checklist para imprimir"],
      ],
    },
    aprendeH2: "O que você encontra em cada capítulo",
    aprendeSub: "Do primeiro pacote de arroz até três meses de comida guardada, na ordem em que você vai precisar.",
    aprende: [
      ["Por que ter uma reserva", "A diferença entre estocar e acumular, e a regra da terça-feira comum, que resolve quase toda dúvida sobre o que comprar."],
      ["Os 5 inimigos da comida guardada", "Como oxigênio, umidade, calor, luz e pragas estragam a comida, como você percebe cada um e como se defender."],
      ["O que armazenar e quanto tempo dura", "A tabela com o prazo de cada alimento, do arroz à farinha de mandioca, e os que parecem ótimos para estoque e ficam rançosos em meses."],
      ["Embalagens e sachês absorvedores", "O passo a passo da garrafa PET, do balde e da seladora a vácuo, e a ordem certa para aplicar o sachê sem desperdiçar nenhum."],
      ["Especiarias, sal e açúcar", "O que conserva de verdade, o que só ajuda, e o preparo caseiro com alho que pode causar botulismo."],
      ["Quanto armazenar", "A conta feita com o que a sua família come de verdade, com ajustes para bebês, idosos, dietas especiais e pets."],
      ["Onde guardar", "Os piores lugares da casa, como achar o ponto mais fresco com um termômetro barato e onde esconder a reserva num apartamento pequeno."],
      ["Rotação e inventário", "O sistema que faz a comida girar sozinha no armário, para nada vencer esquecido no fundo da prateleira."],
      ["Água", "Quanto guardar por pessoa, a água que a comida seca pede para ser cozida, como tratar com hipoclorito e como guardar por até 5 anos."],
      ["Seu plano de 90 dias", "O roteiro semana a semana, com lista de compras por fase, até a sua casa ter três meses de comida."],
    ],
    aprendeExtra: "Anexos para imprimir: checklist da despensa, modelo de inventário e tabela de quanto absorvedor usar em cada recipiente.",
    descobertas: [
      "Por que o arroz branco atravessa décadas e o integral fica rançoso em meses",
      "O erro com o açúcar que transforma o pacote num bloco de pedra",
      "O sinal que a embalagem dá, em um ou dois dias, para mostrar que o sachê funcionou",
      "A tampinha de álcool 70 que entra na limpeza da garrafa PET antes de encher",
      "Por que garrafa de leite nunca deve ser usada para guardar água",
      "Onde está a água que a sua casa já tem numa emergência, e que quase ninguém lembra",
      "Como intercalar especiarias e grãos dentro da garrafa para reforçar a conservação",
      "A diferença entre charque e carne de sol na hora de guardar",
    ],
    bonus: {
      h2: "Planilha da Reserva: as contas do livro feitas por você",
      texto: "Junto com o e-book, você recebe a planilha que aplica o método no dia a dia. Funciona no Excel e no Google Planilhas, no computador e no celular.",
      img: ["/assets/produtos/comida/planilha-inventario.webp", 2540, 1007, "Aba Inventário da Planilha da Reserva, preenchida com itens de exemplo"],
      itens: [
        ["Inventário com alerta de validade", "Você registra o que guardou, e a planilha mostra em verde o que está em dia, em laranja o que precisa ser consumido logo e em vermelho o que venceu."],
        ["Calculadora de quanto guardar", "Anote o que a casa consome em duas semanas, escolha a etapa e receba a lista do que ainda falta comprar."],
        ["Calculadora de água", "Soma a água de beber, a de cozinhar e a dos pets, e mostra quantas garrafas ou galões você precisa."],
        ["Calculadora de absorvedores", "Escolha o recipiente e a quantidade, e veja quantos cc de sachê usar."],
      ],
    },
    paraQuem: [
      "Você cuida da casa e quer dormir sabendo que tem comida para as próximas semanas",
      "Você já tentou estocar, perdeu comida para caruncho ou mofo e quer acertar desta vez",
      "Você mora em apartamento e acha que não tem espaço para reserva",
      "O orçamento está apertado e você precisa montar a reserva aos poucos",
      "A sua região sofre com enchente, seca, falta de luz ou estrada que fecha",
      "Você nunca fez reserva e quer começar do jeito certo desde o primeiro pacote",
    ],
    naoPara: [
      "Você procura receitas ou cardápio de emergência. O livro ensina a guardar comida, e a cozinha fica por sua conta",
      "Você quer técnicas de sobrevivência na mata ou montar um bunker",
      "Você prefere comprar tudo num fim de semana sem ler nada antes",
    ],
    autora: {
      img: "/assets/produtos/comida/andreia.webp",
      texto: [
        "Andreia Moraes faz reserva de alimentos para a própria família há 20 anos. Mãe de três filhos e responsável pela casa, foi na despensa dela que cada técnica deste livro foi testada.",
        "Nesse tempo, ela viu muita gente começar com vontade e desistir por falta de método. Viu arroz jogado fora por caruncho, lata estufada no fundo do armário e dinheiro indo para o lixo. Este e-book reúne o que funciona no clima e no bolso de uma família brasileira comum.",
      ],
      frase: "Preparação, para mim, parece com pagar o seguro do carro. Você não espera bater, mas se bater, está coberto.",
    },
    depoimentos: [
      "Andreiaaaa mulher do ceu!! Precisava vir te mandar essa msg.. a gente passou por aquele perrengue de falta de agua aki na regiao mes passado e graças ao seu capitulo de reserva de agua e o plano de 90 dias a gente passou super de boa aqui em casa!! Meus vizinhos tudo doido atras de caminhao pipa e eu com meus galoes prontos. Deuso te abençoe por compartilhar esse conhecimento de verdade ❤️❤️",
      "Oi Andreia, tudo bem? Passando só pra te agradecer pelo e-book!! cara, sensacional. eu moro sozinho em ap pequeno e achava q nao tinha como estocar nada kkkkk usei a dica de medir com o termo higrometro e achei um canto otimo embaixo da cama. Ja embalei meus primeiros 10kg de arroz na garrafa pet com o sachê de O2 igual vc ensinou! vlw demais tmj 🙏👊",
      "Boa noite Andreia, tudo bem? Queria te dar um feedback do ebook. Eu sempre tentava guardar feijão e arroz e dava caruncho em tudo, jogava mto dinheiro fora :( lendo seu livro vi que tava fazendo TUDO errado embalando nos sacos do mercado msm kkkkk. Ja fiz a planilha de inventario que vc colocou nos anexos e ja tamo no ritmo de comprar o item extra toda semana. Muito obrigado msm, me deu uma paz de espirito gigante!!",
      "Oieee Andreia! Comprei o ebook semana passada e ja li todinho!! Amei demais a parte dos temperos e das garrafas pet com o sachê... ja comecei a montar minha reserva aqui pra mim pras criancas e pro meu cachorro tbm (nem sabia q ração estragava tao rapido na embalagem aberta 😱). O plano de 90 dias ta colado na porta da minha geladeira jah haha Muito obrigada por simplificar tudo sem ter aquela paranoia toda bjs!",
    ],
    ofertaH2: "Tudo o que você recebe hoje",
    ofertaImg: { src: "/assets/produtos/comida-que-dura.webp" },
    inclui: [
      "E-book Comida que Dura, em PDF, com 10 capítulos, anexos e 55 páginas para ler no celular, no tablet ou no computador",
      "Bônus: Planilha da Reserva, com inventário e calculadoras de quanto guardar, de água e de absorvedores",
      "Checklist da despensa, modelo de inventário e tabela de absorvedores prontos para imprimir",
    ],
    garantia: "Leia o livro, abra a planilha e comece a sua reserva. Se em até 7 dias você achar que não valeu o investimento, é só pedir o reembolso e devolvemos 100% do valor pago. Você não precisa explicar o motivo.",
    cta: "Quero o e-book e a planilha",
    ctaCurto: "Quero o e-book",
    faq: [
      ["Como eu recebo o e-book e a planilha?", "Assim que o pagamento é confirmado, o material fica liberado na sua área de compras da Hubla, a plataforma onde você faz o pagamento. No Pix, costuma levar poucos minutos."],
      ["É um livro físico?", "É um e-book em PDF, diagramado para ler no celular, no tablet ou no computador. Se preferir papel, dá para imprimir."],
      ["Nunca fiz reserva de comida. O livro serve para mim?", "Serve, e foi escrito pensando em quem está começando. Ele vai do primeiro pacote de arroz até três meses de comida guardada, com um plano semana a semana."],
      ["Preciso gastar muito para começar?", "O plano de 90 dias começa com um item a mais em cada ida ao mercado. A reserva cresce no ritmo do seu orçamento."],
      ["Moro em apartamento pequeno. Vou ter onde guardar?", "O capítulo 7 mostra onde guardar comida em casas pequenas: embaixo da cama, no alto dos armários, atrás dos livros, dentro de baús e pufes."],
      ["Onde eu compro o sachê absorvedor de oxigênio?", "Em lojas de embalagem e em sites de venda online. O livro explica o que conferir no anúncio para não comprar sachê errado ou já gasto."],
      ["Os prazos de validade do livro são confiáveis?", "Os prazos longos vêm de pesquisas da Utah State University e da Brigham Young University, medidos com a comida guardada a 24 °C ou menos. O livro mostra como ajustar esses prazos para o calor brasileiro."],
      ["A planilha funciona no celular?", "Funciona no Google Planilhas, que tem aplicativo gratuito para celular, e no Excel, no computador."],
      ["Quais são as formas de pagamento?", "Pix e cartão de crédito, no checkout seguro da Hubla."],
      ["E se eu não gostar?", "Você tem 7 dias para pedir o reembolso de 100% do valor, sem precisar explicar o motivo."],
    ],
    fechamento: {
      h2: "Quando a próxima crise chegar, o que vai ter no seu armário?",
      a: ["Daqui a 90 dias", "A sua casa pode ter três meses de comida guardada, etiquetada e girando no armário, com a água separada e a planilha avisando o que precisa ser consumido primeiro."],
      b: ["Ou", "Você pode estar no mesmo lugar de hoje, comprando só o que vai comer na semana e torcendo para a estrada não fechar."],
      fim: "O primeiro passo leva cinco minutos: garantir o livro e colar uma folha na porta do armário para anotar o que a sua casa consome.",
    },
    aviso: "As orientações do e-book têm caráter informativo. Siga sempre as instruções dos rótulos dos produtos e, em caso de dúvida sobre saúde ou dieta, procure um profissional.",
    faqExtra: [],
  },
  {
    rota: "mochila-pet",
    slug: "mochila-emergencia-pet",
    titulo: "Ebook Mochila de Emergência do PET — 72 horas de autonomia | IDE",
    descricao: "Guia da Academia IDE para montar a mochila de emergência do seu cão ou gato: água, alimentação, primeiros socorros, transporte e bem-estar por 72 horas. PDF por R$ 19,90.",
    kicker: "Ebook · Academia IDE",
    h1: "Numa evacuação, quem cuida do seu pet?",
    sub: "Este guia mostra como montar a mochila de emergência do seu animal para 72 horas de autonomia — água e alimentação, primeiros socorros, transporte seguro, higiene e bem-estar. Porque eles também fazem parte da família.",
    stats: [["72 h", "De autonomia"], ["Cão e gato", "Família completa"], ["Na hora", "Liberado na Hubla"]],
    problemaKicker: "O problema",
    problemaH2: "O plano da família quase sempre esquece o pet",
    problema: [
      "Na hora de sair de casa às pressas, o animal precisa de água, comida, remédio, guia, caixa de transporte — e alguém que já tenha pensado nisso antes. Sem preparo, ele vira mais uma preocupação no pior momento.",
      "Com uma mochila própria, montada com antecedência, o seu pet sai junto, com o que precisa para os três primeiros dias. Planeje, treine, evacue e proteja.",
    ],
    aprendeH2: "O que o guia cobre",
    aprende: [
      ["Água e alimentação", "quanto levar e como guardar para 72 horas."],
      ["Primeiros socorros", "o que ter à mão para cuidar do animal fora de casa."],
      ["Transporte seguro", "como levar o pet com segurança numa saída rápida."],
      ["Higiene e bem-estar", "para o animal passar os primeiros dias com menos estresse."],
    ],
    paraQuem: [
      "Tutores de cães e gatos que querem incluir o pet no plano de emergência da família.",
      "Quem mora em área sujeita a enchente, incêndio ou falta de energia.",
      "Quem já tem a mochila da família e falta a do animal.",
    ],
    autoria: "Material da Academia IDE Bushcraft & Sobrevivência, de Alex e Andreia Moraes.",
    cta: "Quero o guia do meu pet",
    faqExtra: [
      ["Serve para gato e para cachorro?", "Serve. A preparação vale para os animais da casa — a mochila é ajustada ao porte e às necessidades de cada um."],
    ],
  },
];

/* ------------------------------------------------------------------ página */
function pagina(cfg) {
  const p = produto(cfg.slug);
  const valor = preco(p);
  const url = `${SITE}/${cfg.rota}`;
  const img = p.imagens[0]; // .webp 1200x750
  const ogImg = SITE + img.replace(/\.webp$/, ".jpg");
  const link = p.link;
  const outros = PAGINAS.filter((x) => x !== cfg).map((x) => ({ ...x, p: produto(x.slug) }));
  const pasta = produto("pasta-emergencia-familia");

  const ld = [
    {
      "@context": "https://schema.org", "@type": "Product", name: p.nome, description: cfg.descricao,
      sku: p.slug, category: p.categoria, brand: { "@type": "Brand", name: MARCA }, image: [ogImg],
      offers: { "@type": "Offer", url, priceCurrency: "BRL", price: valor.toFixed(2), availability: "https://schema.org/InStock", seller: { "@type": "Organization", name: MARCA } },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Loja", item: SITE + "/loja" },
        { "@type": "ListItem", position: 3, name: p.nome },
      ],
    },
  ].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n");

  const hero = cfg.heroImg || { src: img, w: 1200, h: 750, alt: p.imagem_alt || "Capa do " + p.nome };
  const ctaCurto = cfg.ctaCurto || cfg.cta;
  const faq = cfg.faq ? [...cfg.faq, ["Tenho uma dúvida que não está aqui.", 'Fale com a gente no WhatsApp: <a href="https://wa.me/5561993461237" target="_blank" rel="noopener">(61) 99346-1237</a>.']] : [
    ["Como eu recebo o material?", "Assim que o pagamento é aprovado, o material fica liberado na hora na sua área de compras da Hubla, a plataforma onde você faz o pagamento."],
    ["Em que formato é?", "É um PDF. Você lê no celular, no tablet ou no computador — e pode imprimir se preferir."],
    ["Como posso pagar?", "Pix ou cartão de crédito, no checkout seguro da Hubla."],
    ["É assinatura?", `Não. É um pagamento único de R$ ${brl(valor)}.`],
    ...cfg.faqExtra,
    ["Tenho uma dúvida que não está aqui.", 'Fale com a gente no WhatsApp: <a href="https://wa.me/5561993461237" target="_blank" rel="noopener">(61) 99346-1237</a>.'],
  ];

  return `<!DOCTYPE html>
<!-- Gerado por scripts/gerar-paginas-ebooks.js. Edite o texto lá e rode o script. -->
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(cfg.titulo)}</title>
<meta name="description" content="${esc(cfg.descricao)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="product">
<meta property="og:site_name" content="${MARCA}">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(p.nome)}">
<meta property="og:description" content="${esc(cfg.descricao)}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="750">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.nome)}">
<meta name="twitter:description" content="${esc(cfg.descricao)}">
<meta name="twitter:image" content="${ogImg}">
${ld}
<link rel="icon" href="/assets/favicon-ide.png">
<link rel="stylesheet" href="/assets/store.css">
<link rel="stylesheet" href="/assets/ebook.css">
<script src="/assets/track.js"></script>
</head>
<body>

<header class="pf-hero">
  <div class="wrap">
    <a class="brand" href="/loja"><img src="/assets/logo-ide-192.webp" alt="IDE" width="52" height="52"><span>IDE Preparação Familiar</span></a>
    <div class="hero-media${hero.retrato ? " retrato" : ""}">
      <img src="${hero.src}" width="${hero.w}" height="${hero.h}" alt="${esc(hero.alt)}" fetchpriority="high">
    </div>
    <div class="hero-copy">
      <div class="kicker" style="color:#e9a24a">${esc(cfg.kicker)}</div>
      <h1>${esc(cfg.h1)}</h1>
      <p class="sub">${esc(cfg.sub)}</p>${cfg.heroLista ? `
      <ul class="hero-list">
${cfg.heroLista.map((t) => `        <li>${esc(t)}</li>`).join("\n")}
      </ul>` : ""}
      <div class="ctas">
        <a class="btn btn-accent" href="${link}" data-cta="ebook-hero">${esc(ctaCurto)} — R$ ${brl(valor)}</a>
      </div>
      <p class="hero-note">${esc(cfg.heroNota || "Pagamento único · Pix ou cartão · liberado na hora na Hubla")}</p>
      <div class="pf-stats">
${cfg.stats.map(([b, s]) => `        <div class="st"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("\n")}
      </div>
    </div>
  </div>
</header>

<main>
${cfg.linhaDoTempo ? `
  <section class="section-light">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">${esc(cfg.linhaDoTempo.kicker)}</div><h2>${esc(cfg.linhaDoTempo.h2)}</h2></div>
      <div class="tl">
${cfg.linhaDoTempo.itens.map(([d, t, x]) => `        <div class="tl-item"><div class="tl-date">${esc(d)}</div><b>${esc(t)}</b><p>${esc(x)}</p></div>`).join("\n")}
      </div>
${cfg.linhaDoTempo.fecho.map((t) => `      <p class="lead" style="margin-top:var(--space-5)">${esc(t)}</p>`).join("\n")}
    </div>
  </section>
` : ""}
  <section class="${cfg.linhaDoTempo ? "section-soft" : "section-light"}">
    <div class="wrap narrow">
      <div class="kicker">${esc(cfg.problemaKicker)}</div>
      <h2 class="h2">${esc(cfg.problemaH2)}</h2>
${cfg.problema.map((t) => `      <p class="lead">${esc(t)}</p>`).join("\n")}${cfg.inimigos ? `
      <div class="enemies">
${cfg.inimigos.itens.map(([b, t]) => `        <div><b>${esc(b)}</b><span>${esc(t)}</span></div>`).join("\n")}
      </div>
      <p class="lead">${esc(cfg.inimigos.fecho)}</p>` : ""}
    </div>
  </section>
${cfg.metodo ? `
  <section class="section-light">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">${esc(cfg.metodo.kicker)}</div><h2>${esc(cfg.metodo.h2)}</h2></div>
      <div class="metodo">
        <div>
${cfg.metodo.texto.map((t) => `          <p class="lead">${esc(t)}</p>`).join("\n")}
          <div class="compara">
${cfg.metodo.compara.map(([a, b], k) => `            <div class="${k ? "bom" : ""}"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join("\n")}
          </div>
          <p class="fonte">${esc(cfg.metodo.fonte)}</p>
          <a class="btn btn-accent" href="${link}" data-cta="ebook-metodo">${esc(ctaCurto)}</a>
        </div>
        <div class="paginas">
${cfg.metodo.paginas.map(([src, alt]) => `          <img src="${src}" width="720" height="1080" alt="${esc(alt)}" loading="lazy">`).join("\n")}
        </div>
      </div>
    </div>
  </section>
` : ""}
  <section class="section-soft">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">Conteúdo</div><h2>${esc(cfg.aprendeH2)}</h2>${cfg.aprendeSub ? `<p>${esc(cfg.aprendeSub)}</p>` : ""}</div>
      <div class="learn">
${cfg.aprende.map(([b, t], i) => `        <div class="item"><div class="n">${String(i + 1).padStart(2, "0")}</div><div><b>${esc(b)}</b><p>${esc(t)}</p></div></div>`).join("\n")}
      </div>${cfg.aprendeExtra ? `
      <p class="extra-note">${esc(cfg.aprendeExtra)}</p>` : ""}
    </div>
  </section>
${cfg.descobertas ? `
  <section class="section-light">
    <div class="wrap narrow">
      <div class="sec-head"><div class="kicker">Dentro do livro</div><h2>Algumas coisas que você vai descobrir</h2></div>
      <ul class="recv">
${cfg.descobertas.map((t) => `        <li>${esc(t)}</li>`).join("\n")}
      </ul>
      <p style="margin-top:var(--space-6)"><a class="btn btn-accent" href="${link}" data-cta="ebook-descobertas">Quero descobrir tudo isso</a></p>
    </div>
  </section>
` : ""}${cfg.bonus ? `
  <section class="section-soft">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">Bônus incluído</div><h2>${esc(cfg.bonus.h2)}</h2><p>${esc(cfg.bonus.texto)}</p></div>
      <img class="bonus-img" src="${cfg.bonus.img[0]}" width="${cfg.bonus.img[1]}" height="${cfg.bonus.img[2]}" alt="${esc(cfg.bonus.img[3])}" loading="lazy">
      <div class="learn" style="margin-top:var(--space-6)">
${cfg.bonus.itens.map(([b, t]) => `        <div class="item"><div><b>${esc(b)}</b><p>${esc(t)}</p></div></div>`).join("\n")}
      </div>
    </div>
  </section>
` : ""}
  <section class="section-light">
    <div class="wrap narrow">
      <div class="sec-head"><div class="kicker">Para quem é</div><h2>Feito para você se…</h2></div>
      <ul class="recv">
${cfg.paraQuem.map((t) => `        <li>${esc(t)}</li>`).join("\n")}
      </ul>${cfg.naoPara ? `
      <h3 class="nao-h">Talvez não seja para você se…</h3>
      <ul class="nao">
${cfg.naoPara.map((t) => `        <li>${esc(t)}</li>`).join("\n")}
      </ul>` : ""}
    </div>
  </section>

  <section class="section-soft">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">Como funciona</div><h2>Três passos</h2></div>
      <div class="steps3">
        <div class="step"><div class="n">1 · Compra</div><p>Você paga uma vez, com Pix ou cartão, no checkout seguro da Hubla.</p></div>
        <div class="step"><div class="n">2 · Acesso</div><p>O PDF fica liberado na hora na sua área de compras da Hubla.</p></div>
        <div class="step"><div class="n">3 · Prática</div><p>Lê no celular ou imprime, e coloca em prática com a sua família.</p></div>
      </div>
    </div>
  </section>

${cfg.autora ? `  <section class="section-light">
    <div class="wrap mid">
      <div class="autora">
        <img src="${cfg.autora.img}" width="840" height="1050" alt="Andreia Moraes" loading="lazy">
        <div>
          <div class="kicker">A autora</div>
          <h2 class="h2">Quem escreveu este guia</h2>
${cfg.autora.texto.map((t) => `          <p class="lead">${esc(t)}</p>`).join("\n")}
          <blockquote>“${esc(cfg.autora.frase)}”<cite>Andreia Moraes</cite></blockquote>
        </div>
      </div>
    </div>
  </section>
` : `  <section class="section-light">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">Quem fez</div><h2>De quem ensina preparação em campo</h2><p>${esc(cfg.autoria)}</p></div>
      <div class="team">
        <div class="person">
          <img src="/assets/escolas/moraes.webp" alt="Alex Moraes" loading="lazy">
          <div class="pb"><div class="nome">Alex Moraes</div><div class="role">Instrutor-chefe da IDE</div>
            <p>Fuzileiro Naval com mais de 30 anos de carreira militar. Instrutor de sobrevivência, navegação terrestre, abrigos, fogo e primeiros socorros.</p></div>
        </div>
        <div class="person">
          <img src="/assets/escolas/andreia.webp" alt="Andreia Moraes" loading="lazy">
          <div class="pb"><div class="nome">Andreia Moraes</div><div class="role">Instrutora da IDE</div>
            <p>Responsável pelos módulos de rotina doméstica, estoque e organização familiar — a parte que faz o plano funcionar no dia a dia da casa.</p></div>
        </div>
      </div>
    </div>
  </section>

`}
${cfg.depoimentos ? `  <section class="section-soft">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">Depoimentos</div><h2>Quem já começou a própria reserva</h2><p>Mensagens de leitores que aplicaram o método em casa.</p></div>
      <div class="depos">
${cfg.depoimentos.map((t) => `        <blockquote>${esc(t)}</blockquote>`).join("\n")}
      </div>
    </div>
  </section>

` : ""}  <section class="${cfg.depoimentos ? "section-light" : "section-soft"} oferta" id="comprar">
    <div class="wrap">
      <div class="sec-head center"><div class="kicker">${esc(p.nome)}</div><h2>${esc(cfg.ofertaH2 || "Comece hoje")}</h2></div>
      <div class="box">
        <img class="cover" src="${img}" width="1200" height="750" alt="" loading="lazy">
        <div class="price"><span class="cur">R$</span><span class="val">${brl(valor)}</span></div>
        <p class="price-note"><strong>pagamento único</strong> · Pix ou cartão</p>
        <ul class="incl">
${(cfg.inclui || p.caracteristicas).map((c) => `          <li>${esc(c)}</li>`).join("\n")}
        </ul>
        <a class="btn btn-accent btn-block" href="${link}" data-cta="ebook-oferta">${esc(cfg.cta)}</a>
        <p class="fine">O pagamento é feito na plataforma segura da Hubla. Assim que é aprovado, o material fica liberado na sua área de compras.</p>
      </div>${cfg.garantia ? `
      <div class="garantia"><b>Garantia incondicional de 7 dias</b><p>${esc(cfg.garantia)}</p></div>` : ""}
    </div>
  </section>

  <section class="section-light faq">
    <div class="wrap narrow">
      <div class="sec-head"><div class="kicker">Dúvidas</div><h2>Perguntas frequentes</h2></div>
${faq.map(([q, a]) => `      <details><summary>${esc(q)}</summary><div class="answer">${a}</div></details>`).join("\n")}
    </div>
  </section>

${cfg.fechamento ? `
  <section class="section-soft">
    <div class="wrap mid">
      <div class="sec-head center"><h2>${esc(cfg.fechamento.h2)}</h2></div>
      <div class="duas">
        <div class="sim"><b>${esc(cfg.fechamento.a[0])}</b><p>${esc(cfg.fechamento.a[1])}</p></div>
        <div><b>${esc(cfg.fechamento.b[0])}</b><p>${esc(cfg.fechamento.b[1])}</p></div>
      </div>
      <p class="lead" style="text-align:center;max-width:56ch;margin:var(--space-6) auto">${esc(cfg.fechamento.fim)}</p>
      <p style="text-align:center"><a class="btn btn-accent" href="${link}" data-cta="ebook-fechamento">Começar minha reserva hoje — R$ ${brl(valor)}</a></p>
    </div>
  </section>
` : ""}
  <section class="${cfg.fechamento ? "section-light" : "section-soft"}">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">Continue se preparando</div><h2>Outros materiais da IDE</h2></div>
      <div class="more">
${outros.map((o) => `        <a class="card" href="/${o.rota}"><img src="${o.p.imagens[0]}" width="1200" height="750" alt="" loading="lazy"><span class="t">${esc(o.p.nome)}</span><span class="pr">R$ ${brl(preco(o.p))}</span></a>`).join("\n")}
        <a class="card" href="/pasta"><img src="${pasta.imagens[0]}" width="1200" height="750" alt="" loading="lazy"><span class="t">${esc(pasta.nome)}</span><span class="pr">Ver na loja</span></a>
      </div>
      <p class="all"><a href="/loja">Ver a loja completa →</a></p>
    </div>
  </section>

</main>

<section class="contato">
  <div class="wrap">
    <p class="aviso"><strong>Este material ajuda a sua família a se preparar. Ele não substitui o serviço público de emergência.</strong><br>Em qualquer ocorrência real, ligue: 193 Bombeiros · 192 SAMU · 190 Polícia · 199 Defesa Civil</p>${cfg.aviso ? `
    <p class="aviso">${esc(cfg.aviso)}</p>` : ""}
    <div class="social">@moraes.preparacao · @andreia.preparacao</div>
    <div class="social" style="margin-top:6px">Academia IDE Bushcraft &amp; Sobrevivência · Brasília, DF</div>
    <p class="slogan">Preparar não é medo. É cuidado.</p>
  </div>
</section>

<footer class="foot">
  <div class="wrap">
    <span>© IDE Preparação Familiar</span>
    <a href="/loja">Loja</a>
    <a href="/privacidade">Privacidade</a>
    <span>WhatsApp: <a href="https://wa.me/5561993461237" target="_blank" rel="noopener">(61) 99346-1237</a></span>
  </div>
</footer>

<div class="sticky-cta">
  <a class="btn btn-accent" href="${link}" data-cta="ebook-sticky">${esc(ctaCurto)} — R$ ${brl(valor)}</a>
</div>

<script>
  if (window.cardumeTrack) window.cardumeTrack('view_item', { item_id: ${JSON.stringify(p.slug)}, item_name: ${JSON.stringify(p.nome)}, content_name: ${JSON.stringify(p.nome)}, value: ${valor}, currency: 'BRL' });
</script>
<script src="/assets/checkout.js"></script>
</body>
</html>
`;
}

for (const cfg of PAGINAS) {
  fs.mkdirSync(path.join(RAIZ, cfg.rota), { recursive: true });
  fs.writeFileSync(path.join(RAIZ, cfg.rota, "index.html"), pagina(cfg));
}

// o sitemap ganha as páginas novas (o gerar-paginas-loja.js tira as /produto/ antigas)
const hoje = new Date().toISOString().slice(0, 10);
let mapa = fs.readFileSync(path.join(RAIZ, "sitemap.xml"), "utf8");
for (const cfg of PAGINAS) {
  const loc = `<loc>${SITE}/${cfg.rota}</loc>`;
  if (mapa.includes(loc)) {
    mapa = mapa.replace(new RegExp(`(${loc.replace(/[.]/g, "\\.")}<lastmod>)[^<]*`), `$1${hoje}`);
  } else {
    mapa = mapa.replace("</urlset>", `  <url>${loc}<lastmod>${hoje}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n</urlset>`);
  }
}
fs.writeFileSync(path.join(RAIZ, "sitemap.xml"), mapa);
console.log("ok: " + PAGINAS.map((c) => "/" + c.rota).join(", "));
module.exports = { PAGINAS };
