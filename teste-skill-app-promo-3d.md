# Prompt de teste — skill `app-promo-3d`

Cole o bloco abaixo numa conversa nova (neste repositório) para testar a skill do zero.

---

```
Use a skill app-promo-3d para criar um comercial do Nubank. Não precisa me fazer perguntas, está tudo definido aqui:

- Uso: estudo interno (peça conceitual, não é campanha oficial).
- Duração e formato: 20 segundos, 16:9 1920×1080.
- Conceito: tour pelo app com clima de marca. Fundo escuro com roxo Nubank (#820AD1) e brilhos lilás.
- Dispositivo: iPhone iOS 26.
- Idioma: português. Conteúdo da UI todo fictício (nome "Lia", contatos e valores inventados).
- Música: real e livre de direitos, eletrônica animada com drop (NCS pelo SoundCloud). Use analyze_music para colocar o drop no segundo 6.
- Áudio: música + SFX, sem narração.
- Slogan final: "Seu dinheiro, do seu jeito."
- Logo: baixe o logo oficial do Nubank (página de imprensa/marca) e respeite as regras: uma cor só, sem distorcer.

Roteiro:
1. 0–2s: iPhone 3D em 3/4 com luz roxa varrendo o piso; texto "E se o banco coubesse no seu bolso?" palavra por palavra.
2. 2–4s: câmera mergulha na tela, ícone do Nubank em destaque; toque; animação de abertura do app.
3. 4–6s: tela inicial do app com saldo oculto ("R$ ••••"); toque no olho revela "R$ 2.481,90" com contador animado.
4. 6s DROP: clarão roxo, órbita do celular. Fluxo de Pix: digitar o valor "50,00" no teclado numérico com zoom acompanhando, escolher o contato "Mateus", confirmar. Check de sucesso com confete roxo, na batida.
5. 11–15s: cartão roxo virtual em close (vidro e reflexo) e um card de vidro grande ao lado com "Fatura de março: R$ 312,40 — pague com 1 toque".
6. 15–18s: resumo do mês em cards de vidro, um por compasso, com transição em chicote: "R$ 1.240 economizados", "Caixinha Viagem: 68%".
7. 18–20s: o roxo vira o logo oficial; slogan na batida; logo + "Peça conceitual — estudo" + crédito da música.

Entregue: MP4 30 qps com motion blur, MP4 60 qps e a folha de quadros. Antes do render final, me mostre a folha de quadros parados para eu aprovar.
```

---

## O que observar no teste
- Se a skill segue o fluxo dela:
  1. briefing já respondido;
  2. assets;
  3. analyze_music;
  4. roteiro na batida;
  5. folha de quadros;
  6. aprovação;
  7. capture;
  8. mix;
  9. assemble.
- Tempo de render: 1,2–2 capturas/s neste contêiner. 20 s = 3000 capturas ≈ 25–40 min.
- Se respeita a marca: logo de uma cor só e nenhum dado pessoal.
