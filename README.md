# inmetro-chain


## Metamesk and Besu

Este documento tem como objetivo elucidar alguns pontos de desenvolvimento utilizando a plataforma besu em conjunto com o metamesk. A implementação conta com: 

Três abordagens principais:

1 - Transferência via código (node.js + web3): neste método a transferência é executada diretamente pelo código utilizando a biblioteca web3 e a chave privada do remetente. A chave privada costuma ser lida de um arquivo inseguro.

2 - Uso de MetaMask: aqui a assinatura e a gestão da chave privada ficam protegidas pela carteira do usuário (MetaMask). Entretanto, ao operar sobre um nó Besu que herda algumas particularidades da rede Ethereum, surgem alguns  riscos: por exemplo, um agente malicioso pode induzir o usuário a aprovar uma transação que conceda permissão a um contrato perigoso; se esse contrato usar um padrão proxy, sua implementação pode ser alterada depois, passando a apontar para um contrato malicioso e comprometendo a custódia dos fundos.


3 - Interação via contrato inteligente próprio: neste cenário o desenvolvedor (ou uma carteira controladora) faz o deploy de um contrato que gerencia as transferências. Após o deploy, existem diferentes formas de interação/execução dependendo da lógica do contrato e dos requisitos de segurança.


## Deploy

Para Iniciar execute o comando na pasta principal para levantar a rede:
```bash
  ./run.sh
```

Para mais exemplos de uso na rede, consulte o link: https://besu.hyperledger.org/private-networks/tutorials/quickstart.

Nota: Diferente do tutorial padrão, esta configuração inclui containers extras para funções adicionais. Por exemplo, ela conta com um proxy reverso (utilizando Caddy) e um container dedicado ao servidor em Node.js.

O primeiro exemplo é o arquivo config/jwt/scripts/notls/web3_eth_tx.js, que mostra como usar uma carteira interna do Besu para transferir criptocréditos para outra conta. As carteiras geradas com a blockchain já vêm com uma reserva de crédito, o que facilita o teste. Para executar, utilize o comando:

```bash
curl -X POST      
            -H "Content-Type: application/json"     
            -d '{ "acc": "publickey"}'      
            http://localhost:3000/receive

```

Observação: Para executar os próximos passos, é necessário ter a extensão MetaMask instalada. Acesse o site oficial https://metamask.io/
 para realizar a instalação.

O segundo método consiste na utilização das ferramentas disponibilizadas pelo MetaMask. Nesse caso, é preciso adicionar uma rede personalizada, configurando-a com os parâmetros específicos do ambiente de execução. Além disso, para que a transferência de criptoativos seja possível, a carteira deve estar conectada à rede blockchain correspondente.

O terceiro método baseia-se na utilização de funções disponíveis na linguagem Solidity. Neste exemplo, foram implementadas três funções principais:

sendViaTransfer: método mais antigo, não recomendado devido à limitação de gás.

sendViaSend: funcionalmente semelhante a sendViaTransfer, porém exige verificação manual do sucesso da transação.

sendViaCall: método moderno e recomendado, por ser o mais flexível e seguro contra limitações de gás, permitindo que o contrato de destino processe corretamente a transação.

Para testar a função de transferência via contrato inteligente, é necessário executar uma interface simples desenvolvida em React Native utilizando o framework Vite. Para acessá-la, siga os comandos abaixo:

```bash
cd metamask
npx vite
```

O vite vai disponibilizar um local ao qual voce teŕa acesso como:

```bash
VITE v7.0.0  ready in 352 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Acesse o Local pelo navegador e, primeiramente, clique no botão Conectar à rede. Em seguida, utilize o botão Receive para receber um criptoativo. Após o recebimento, realize o deploy do contrato inteligente e aguarde até que a transação seja concluída. Todo o processo pode ser acompanhado pelo console do navegador. Na interface, estarão disponíveis três métodos para o envio de pequenas quantias de Ether para diferentes carteiras. Caso seja necessário alterar os valores definidos no contrato (metamask/src/assets/contract/sendethers.sol), é preciso recompilá-lo. Já para modificar as carteiras de destino, será necessário ajustar o código-fonte.



