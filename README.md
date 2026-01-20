# Inmetro-chain

Este repositório tem como objetivo a construção de uma plataforma de monetização, a qual utiliza a blockchain Hyperledger Besu. O Besu é uma DLT (Distributed Ledger Technology), ou seja, um livro-razão digital distribuído responsável por registrar as transações realizadas pelos usuários. Ele foi desenvolvido em 2019 no âmbito do Hyperledger, um projeto colaborativo open source mantido pela The Linux Foundation.

O Besu é um cliente Ethereum projetado para ser amigável ao uso corporativo (enterprise-friendly), atendendo tanto a redes públicas quanto a redes privadas permissionadas, e conta com uma implementação extraível da EVM (Ethereum Virtual Machine). Além disso, pode ser executado em redes de teste, como Sepolia e Görli.

A plataforma oferece suporte a diversos algoritmos de consenso, incluindo Proof of Stake (PoS), Proof of Work (PoW) e Proof of Authority (PoA), com implementações como IBFT 2.0, QBFT e Clique. Adicionalmente, seus mecanismos abrangentes de permissionamento foram projetados especificamente para atender ambientes de consórcio, garantindo maior controle, segurança e governança da rede.

## Tecnologias

Besu

ETHSigner

QUORUM_EXPLORER

Caddy

MongoDB

mongo-express

Solidity 

JS

node express

## Iniciar rede

Para iniciar a rede blockchain execute o comando na pasta principal para levantar a rede, este arquivo se encontra na raiz da pasta (Besu-Starter):


```
  ./run.sh
```

Para mais exemplos de uso na rede, consulte o link: https://besu.hyperledger.org/private-networks/tutorials/quickstart.

Nota: Diferente do tutorial padrão, esta configuração inclui containers extras para funções adicionais. Por exemplo, ela conta com um proxy reverso (utilizando Caddy) e um container dedicado ao servidor em Node.js.

## Servidor 

O servidor utiliza o Express.js, um framework de aplicação web para back-end em Node.js, disponibilizado como software livre e de código aberto. Há duas formas de testá-lo: por meio de um container Docker ou executando-o diretamente no ambiente local, sem o uso do Docker. O container é identificado pelo nome nodetls. Caso se opte pela execução sem o container, é necessário utilizar os seguintes comandos:

```
cd config/jwt

node server.js
```


Após os containers estarem disponíveis, é possível testar todos os endpoints utilizados. No arquivo curl.txt estão listadas todas as opções disponíveis na rede, as quais são posteriormente utilizadas pelo aplicativo de captura de dados veiculares. A seguir, apresenta-se um exemplo de execução de um comando utilizando o curl:

```
curl --header "Content-Type: application/json" \
--request POST \
--data '
{
  "wallet": "0x4288201baC903F84648E81A07F793C9E7d893692",
  "vin": "JM1BM1V37F1238727",
  "usertank": "40"
}
' http://localhost:3000/create/contract

```

Caso você deseje enviar informações ou realizar testes, há dois arquivos que podem ser utilizados. O primeiro é o curltest, no qual é possível alterar a carteira (wallet) utilizada nas requisições. O segundo arquivo, testandroid.sh, é responsável pelo envio de informações veiculares. Para executá-lo, utilize o comando:

```
./testandroid.sh
```

Observe que pode ser necessário alterar a carteira de identificação caso você queira utilizar outro endereço para testar o processo de monetização de dados. Essas informações podem ser visualizadas via curl ou por meio do aplicativo Android de captura de dados veiculares.

Você pode verificar essas funcionalidades na pasta config/jwt. Dentro desse diretório encontram-se os contratos utilizados no processo de monetização, escritos em Solidity, além de todas as bibliotecas necessárias para o seu funcionamento. Caso seja necessário compilar novos contratos, utilize o script compile.js. Os contratos podem ser divididos em:

Contrato Controlador :


Atua como a autoridade central do sistema, controlado por uma carteira principal designada. Sua função principal é operar como uma factory, responsável pela criação, implantação e registro de uma nova instância do contrato de usuário para cada participante. Este contrato mantém o mapeamento oficial entre a identidade do usuário e o endereço de seu contrato personalizado na blockchain, estabelecendo a base de confiança para todo o ecossistema.

Contrato do Usuário :


É um contrato inteligente único, gerado dinamicamente pelo Contrato Controlador para cada usuário. Funciona como a representação digital do participante no sistema, um "cofre pessoal" onde seus ativos, permissões e estado são gerenciados de forma isolada e segura. Este contrato executa a lógica específica das interações do usuário dentro da plataforma.


Contrato de Transações :


Este contrato é o orquestrador das operações de envio na rede blockchain. Ele atua como uma camada de roteamento e validação, intermediando todas as transferências ou comunicações iniciadas pelo usuário através de seu Contrato do Usuário. Sua responsabilidade é garantir a integridade, aplicar regras de negócio (como taxas ou limites) e registrar de forma eficiente e auditável as transações no ledger distribuído, desacoplando a lógica de envio da gestão dos ativos do usuário.


