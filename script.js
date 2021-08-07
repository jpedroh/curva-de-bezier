var canvas = document.getElementById("canvas_bezier");

canvas.width = document.getElementById("canvas_bezier_container").scrollWidth;
canvas.height =
  document.getElementById("canvas_bezier_container").scrollHeight -
  0.042 * window.innerHeight;

var context = canvas.getContext("2d");
var rect = canvas.getBoundingClientRect();
var pontos = [];
var curvas = [pontos];
var avaliacoesCurva = 200;
var quant = 0;
var pontosControle = 1;
var mostrarPontosControleBezier = 0;
var poligonaisControle = 1;
var poligonaisControleBezier = 0;
var exibirCurva = 1;
var moverSelecionado = false;
var noCirculo = false;

//------------------ CONTROLES -------------------
function novaCurva() {
  if (curvas[quant].length != 0) {
    pontos = [];
    quant = curvas.length;
    gerarCurva();
  }
}

function deletarCurva() {
  pontos = [];
  curvas = [];
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function curvaAnterior() {
  if (quant > 0) {
    quant--;
    pontos = curvas[quant];
    gerarCurva();
  }
}

function proximaCurva() {
  if (quant < curvas.length - 1) {
    quant++;
    pontos = curvas[quant];
    gerarCurva();
  }
}

function mudarAvaliacao() {
  avaliacoesCurva = document.getElementById("avaliacoesCurva").value;
  gerarCurva();
}

function moverPonto() {
  document.getElementById("moverPontoButton").classList.toggle("active");
  moverSelecionado = true;
}

function alternarPontosControle(evt) {
  document.getElementById("pontosControleButton").classList.toggle("active");
  pontosControle = !pontosControle;
  gerarCurva();
}

function alternarPontosControleBezier(evt) {
  document
    .getElementById("pontosControleBezierButton")
    .classList.toggle("active");
  mostrarPontosControleBezier = !mostrarPontosControleBezier;
  gerarCurva();
}

function alternarPoligonaisControle() {
  document
    .getElementById("poligonaisControleButton")
    .classList.toggle("active");
  poligonaisControle = !poligonaisControle;
  gerarCurva();
}

function alternarPoligonaisControleBezier() {
  document
    .getElementById("poligonaisControleBezierButton")
    .classList.toggle("active");
  poligonaisControleBezier = !poligonaisControleBezier;
  gerarCurva();
}

function alternarExibicaoCurvas() {
  document.getElementById("exibicaoCurvasButton").classList.toggle("active");
  exibirCurva = !exibirCurva;
  gerarCurva();
}

//------------ Mouse ----------------
canvas.addEventListener("mousedown", function (event) {
  if (event.which == 1 && !moverSelecionado) {
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    pontos.push({ x: x, y: y });
    curvas[quant] = pontos;
    gerarCurva();
  } else if (event.which == 1 && moverSelecionado) {
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    let indice = estaNoCirculo({ x: x, y: y });
    if (noCirculo) {
      canvas.addEventListener(
        "mouseup",
        (onMouseUp = (event) => {
          canvas.removeEventListener("mouseup", onMouseUp);
          canvas.removeEventListener("mousemove", onMouseMove);
        })
      );
      canvas.addEventListener(
        "mousemove",
        (onMouseMove = (event) => {
          curvas[quant][indice].x =
            event.clientX - canvas.getBoundingClientRect().left;
          curvas[quant][indice].y =
            event.clientY - canvas.getBoundingClientRect().top;
          gerarCurva();
        })
      );
    }
    moverSelecionado = false;
    document.getElementById("moverPontoButton").classList.toggle("active");
    noCirculo = false;
  }
});

document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
  if (!moverSelecionado) {
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    excluirPonto(x, y);
  }
});

//------------ Funções de desenho ----------------
function gerarCurva() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  const pontosControleBezier = calcularPontosControleBezier(pontos);

  if (pontosControle) {
    pontos.forEach((ponto) => {
      mostrarPonto(ponto.x, ponto.y, "rgba(28, 49, 89, 1)");
    });
  }

  if (mostrarPontosControleBezier) {
    pontosControleBezier.forEach((ponto) => {
      mostrarPonto(ponto.x, ponto.y, "rgba(208, 2, 26 , 1)");
    });
  }

  if (poligonaisControleBezier) {
    desenharReta(pontosControleBezier, "rgba(245, 166, 35, 1)", 1);
  }

  if (poligonaisControle) {
    desenharReta(curvas[0], "rgba(28, 49, 89, 1)", 1);
  }
  if (exibirCurva) {
    const cores = ["rgba(28, 49, 89, 1)", "rgba(125, 212, 32, 1)"];

    for (let i = 0; i < pontosControleBezier.length; i += 3) {
      desenharCurva(
        pontosControleBezier.slice(i, i + 4),
        cores[i % cores.length],
        3
      );
    }
  }
}

function calcularPontosControleBezier(pontos) {
  if (pontos.length <= 4) {
    return pontos;
  }

  const L = pontos.length - 3;
  const aux = [];

  // b_0 = d_-1
  aux[0] = pontos[0];
  // b_1 = d_0
  aux[1] = pontos[1];
  // b_2
  aux[2] = {
    x: (1.0 / 2) * pontos[1].x + (1.0 / 2) * pontos[2].x,
    y: (1.0 / 2) * pontos[1].y + (1.0 / 2) * pontos[2].y,
  };

  // b_3l - 1 = d_L
  aux[3 * L - 2] = {
    x: (1.0 / 2) * pontos[L + 1].x + (1.0 / 2) * pontos[L].x,
    y: (1.0 / 2) * pontos[L + 1].y + (1.0 / 2) * pontos[L].y,
  };

  // b_3l - 1 = d_L
  aux[3 * L - 1] = pontos[L + 1];

  // b_3l = d_L + 1
  aux[3 * L] = pontos[L + 2];

  for (let i = 1; i < L - 1; i++) {
    aux[3 * i + 1] = {
      x: (2.0 / 3) * pontos[i + 1].x + (1.0 / 3) * pontos[i + 2].x,
      y: (2.0 / 3) * pontos[i + 1].y + (1.0 / 3) * pontos[i + 2].y,
    };
    aux[3 * i + 2] = {
      x: (1.0 / 3) * pontos[i + 1].x + (2.0 / 3) * pontos[i + 2].x,
      y: (1.0 / 3) * pontos[i + 1].y + (2.0 / 3) * pontos[i + 2].y,
    };
  }

  for (let i = 1; i < L; i++) {
    aux[3 * i] = {
      x: (1.0 / 2) * aux[3 * i - 1].x + (1.0 / 2) * aux[3 * i + 1].x,
      y: (1.0 / 2) * aux[3 * i - 1].y + (1.0 / 2) * aux[3 * i + 1].y,
    };
  }

  return aux;
}

function mostrarPonto(x, y, cor) {
  context.beginPath();
  context.arc(x, y, 10, 0, 2 * Math.PI, true);
  context.moveTo(x, y);
  context.strokeStyle = cor;
  context.fillStyle = cor;
  context.fill();
  context.stroke();
}

function desenharReta(pontos, cor, linha) {
  for (v = 0; v < pontos.length - 1; v++) {
    let x2 = pontos[v + 1].x;
    let y2 = pontos[v + 1].y;
    context.lineWidth = linha;
    context.beginPath();
    context.moveTo(pontos[v].x, pontos[v].y);
    context.lineTo(x2, y2);
    context.strokeStyle = cor;
    context.stroke();
  }
}

function desenharCurva(pontos, cor, linha) {
  const curva = [];
  for (n = 0; n <= avaliacoesCurva; n++) {
    let ponto = deCasteljau(pontos, n);
    curva.push({ x: ponto.x, y: ponto.y });
  }
  desenharReta(curva, cor, linha);
}

function deCasteljau(pontos, n) {
  if (pontos.length > 1) {
    let aux = [];
    let xX;
    let yY;
    for (i = 0; i < pontos.length - 1; i++) {
      xX =
        pontos[i].x * (1 - n / avaliacoesCurva) +
        pontos[i + 1].x * (n / avaliacoesCurva);
      yY =
        pontos[i].y * (1 - n / avaliacoesCurva) +
        pontos[i + 1].y * (n / avaliacoesCurva);
      aux.push({ x: xX, y: yY });
    }
    return deCasteljau(aux, n);
  } else {
    return pontos[0];
  }
}

function excluirPonto(posX, posY) {
  indice = estaNoCirculo({ x: posX, y: posY });
  if (indice > -1) {
    pontos.splice(indice, 1);
    gerarCurva();
  }
}

function estaNoCirculo(ponto) {
  for (f = 0; f < pontos.length; f++) {
    var v = { x: pontos[f].x - ponto.x, y: pontos[f].y - ponto.y };
    if (Math.sqrt(v.x * v.x + v.y * v.y) <= 10) {
      noCirculo = true;
      return f;
    }
  }
  return -1;
}
