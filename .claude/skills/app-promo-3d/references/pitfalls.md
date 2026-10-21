# Erros conhecidos e correções

Todos aconteceram no comercial do Spotify (30 s). Os que estão marcados como resolvidos já foram corrigidos no motor ou nos scripts.

## 1. `hyperframes render` trava no meio (resolvido: não usar para este tipo de vídeo)
- **Sintoma:** "Sequential screenshot capture stalled… stuck at frame 1548/1800". O vídeo inteiro se perdeu depois de 1h20.
- **Causa:** WebGL por software (SwiftShader, sem GPU no contêiner) + captura sequencial sem retomada.
- **Correção:** `scripts/capture.py`.
  - Cada quadro vira um arquivo; rodar de novo continua de onde parou.
  - 4 processos em paralelo.
  - O navegador reinicia a cada 30 quadros.
  - Até 3 tentativas por quadro.
  - A falha é registrada com o tempo exato.

## 2. "Unable to capture screenshot" + "CONTEXT_LOST_WEBGL" (resolvido)
- **Sintoma:** a captura empaca sempre no mesmo trecho (5,3–5,7 s, abertura do app) e os quadros seguintes falham.
- **Causa:** `filter: blur()` em vários elementos dentro da tela ampliada. O Chrome rasteriza a camada inteira com o filtro a 3× e estoura a memória gráfica, derrubando o contexto WebGL.
- **Correção:**
  - Na tela do celular, só opacidade e escala; nada de blur.
  - O motor marca `window.__lost` quando o contexto cai, e a captura reinicia o navegador.

## 3. Render lento: 2,4 s por quadro (resolvido)
Medido com cronômetro dentro da página (`gl.readPixels` para sincronizar):

| Causa | Correção | Resultado |
|---|---|---|
| Print com composição por GPU emulada | `--disable-gpu-compositing` em `_common.py` | cartela: 2,4 s → 0,16 s |
| WebGL desenhando o celular nos closes | não renderizar o 3D quando a tela HTML cobre o quadro (`coverMargin > 2`) | 2,4 s → 0,1–0,2 s |
| Reflexos (IBL) do clearcoat em todas as peças | materiais convertidos para `MeshStandardMaterial` | metade do custo |
| Peças da traseira (lentes, vidro traseiro, platô da câmera) sombreadas mesmo escondidas, porque o SwiftShader não descarta cedo pela profundidade | esconder essas peças quando a câmera vê a frente | close médio: 2,5 s → 0,9 s |

- **Paralelismo não ajuda:** o SwiftShader já usa todos os núcleos num processo só. Com 1, 2 e 4 processos o tempo foi o mesmo, por isso o padrão é 2, que só dilui o tempo de abrir o navegador.
- **Ainda caro:** `backdrop-filter` grande sobre o 3D, como o card de vidro do DJ (~2 s). Use em trechos curtos ou troque por gradiente semitransparente.
- **Na hora de matar processos:** `pkill -f <padrão>` mata o próprio shell, que contém o padrão na linha de comando. Use `pgrep … | xargs kill` num comando separado ou mate pelo PID.

## 4. Motion blur com "fantasma" (resolvido)
- **Antes:** 60 qps com média de 2 quadros (`tmix`) dava obturador de 360° com só 2 amostras e imagem dupla em panorâmicas rápidas.
- **Agora:** 4 subquadros em 1/60 s (180°), com a média feita em luz linear.
- **Normal:** na digitação, a letra nova pode aparecer meio transparente no quadro em que surge.

## 5. Texto ao lado sobrepondo o celular (resolvido)
- **Causa:** o celular era posto à direita movendo o alvo da câmera. Na órbita, o celular "passeava" pelo quadro e invadia a letra.
- **Correção:** `CAM_FX` (deslocamento do quadro via `setViewOffset`). O alvo fica no celular e a órbita gira em torno dele.

## 6. Manchas de luz no rodapé (resolvido)
- **Causa:** o piso metálico refletia as faixas brancas do mapa de ambiente e as luzes de contorno.
- **Correção:** `envMapIntensity` 0,12, rugosidade 0,6 e luz de contorno mais alta e mais atrás.

## 7. `hyperframes check` acusa sobreposição de textos (falso positivo)
- **Causa:** páginas que ficam por baixo de uma folha opaca (teclado, folha do DJ) continuam com texto visível para o verificador.
- **Correção:** esconda (`visibility:hidden`) o conteúdo coberto enquanto a folha estiver aberta.

## 8. Lacuna na grade de ícones
- **Causa:** a linha usada no carrossel ficou uma linha abaixo das outras, deixando uma fileira vazia.
- **Correção:** a fileira animada deve ser a linha seguinte da grade (`GY[n]`).

## 9. Logo em duas cores
- **Problema:** o briefing pediu wordmark branco com ícone verde, mas o kit oficial só tem versões de uma cor.
- **Solução:** usar o logo completo verde sobre `#121212` e avisar o usuário.

## 10. Ícones de apps ausentes
- **Problema:** não há Mapas, Câmera nem Notas no pacote.
- **Solução:** usar os disponíveis (lista em `brief.md`) ou desenhar ícones genéricos simples em CSS. Não inventar ícones parecidos com os oficiais de terceiros.

## 11. Ambiente
- **YouTube:** o `yt-dlp` cai na checagem de robô. Use `scsearch1:` (SoundCloud), que funciona.
- **`Node fetch`:** não passa pelo proxy. Para baixar, use `curl`.
- **Supabase gratuito:** o projeto pausa sem uso. "tenant/user not found" = restaurar o projeto.
- **`sleep` direto no terminal:** é bloqueado. Para esperar a captura, rode em segundo plano (`run_in_background`) e cheque o progresso.

## 12. BPM estimado errado → batidas escorregando
- **Sintoma:** no Spotify usei 129,2 BPM (medido a olho no envelope). O real era 128,0, e o erro acumulou ~0,2 s ao fim de 30 s.
- **Correção:** `analyze_music.py` mede o BPM pelo pico da autocorrelação em 8 batidas, com interpolação. Validado em 128,0 contra os bumbos reais.
- **Confira sempre:** os bumbos depois do drop devem cair em `drop + k × beat`.
- **Escolha do drop:** a lista de candidatos ignora entradas vindas de silêncio (começo e fim da faixa). Escolha o candidato que faz sentido musicalmente, com `--drop`.
