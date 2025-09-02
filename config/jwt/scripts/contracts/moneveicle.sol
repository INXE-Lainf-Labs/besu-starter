// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;



     // Estruturas de dados
    struct  Event {
        address contractAddress;
        string vin; // identificador único do veículo
        string t; // Timestamp de inicio
        uint fuel_b; // volumes de combustível antes
        uint fuel_e; // volumes de combustível depois
        uint abastecimento; //litros
        uint usertank;  //litros

    }

    struct Trajetodata{
        bytes32 storedHash;
        uint dist; //meters 5*(10**18) 
        uint fuel; //% 5*(10**17)
        uint time; //segundos   5*(10**18) 
        uint timeless; //segundos   5*(10**18)    
    }

    struct Trajetosall {
        address contractAddress;
        Trajetodata[] listtrajetos;
        uint idEvent; // Timestamp de inicio
    }


contract MonetizaFactory {
    address public owner;

    mapping(uint => address) public contracts;
    uint public counter;
    uint k;

  
    event ContractCreated(
        uint indexed id,
        address contractAddress,
        address owner
    );

    constructor(address _owner) {
        owner = _owner;
        
    }

    function setK( uint _k) public  {
        require(
            msg.sender == owner,
            "Somente a organizacao autorizada pode definir o preco."
        );
        k = _k;
    }

    function getK() public view returns (uint) {
        return k;

    }

    function checkStatus(uint id) public view returns  (bool) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return  monetiza.getSt(); 
    }


    function getscore(uint id) public view returns (uint,uint,uint) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return monetiza.getscore();
    }

    function getpath(uint id) public view returns  (Trajetosall memory) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return  monetiza.getTrajetos(); 
    }


    function getcoin(uint id) public returns  (uint) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return  monetiza.getcoin();
    }


    function getEventid(uint id) public view returns  (uint) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return  monetiza.getidEvent(); 
    }

    function createNewContract(address wallet) public returns (address) {
        Monetiza newContract = new Monetiza();
        contracts[counter] = address(newContract);
        emit ContractCreated(counter, address(newContract), wallet);
        init(counter, address(newContract), wallet);
        counter++;
        return address(newContract);
    }


    function init(uint id, address contractadress, address wallet) private{
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.initUserScore(id,wallet,contractadress);
    }
    
    function createEvent(uint id, address wallet,address contractAddress, string memory vin, string memory t, uint fuel_b, uint abastecimento, uint usertank) public {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.createEvent(vin, t, fuel_b, abastecimento, usertank,contractAddress, wallet);
        
    }

    function closeevent(uint id, address wallet, address contractAddress)  public {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.closeEvent(wallet,contractAddress );
        
    }

    function getNEvent(uint id)  public view returns (uint) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return monetiza.getNEvent();   
    }


    
    
    function createTrajeto(
            uint id ,
            address wallet, 
            address contractAddress,
            bytes32 _storedHash,
            uint _dist,
            uint _fuel,
            uint _time,
            uint _timeless )  public {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.createTrajeto(_storedHash, _dist, _fuel, _time, _timeless,wallet,contractAddress);
        
    }
    
}

contract Monetiza {


   
    // Variáveis de configuração (se realmente necessárias)
    //numeros tem que ser entre 0 e 10
    uint private confianca = 5e17; //porcentagem
    uint private completude = 0e17; //porcentagem
    uint private frequencia = 0e17; //porcentagem
    uint private m = 9e17; //porcentagem
    
    uint private idEvent = 0; //identificador do numeros de eventos
    uint private coin = 0;
    bool private st = false;

   
    Event private events;//variavel que registras os eventos
    Trajetosall private varTrajetos; //variavel responsavel por armazenar os trajetos

    event userScore(
        address wallet,
        address contractAddress,
        uint indexed id,
        uint confianca,
        uint completude,
        uint frequencia
    );

    event EventRegistered(
        uint idEvent,
        address wallet,
        address contractAddress,
        string vin, // identificador único do veículo
        string t, // Timestamp de inicio
        uint fuel_b, // volumes de combustível antes
        uint fuel_e, // volumes de combustível depois
        uint abastecimento, //litros
        uint usertank  //litros
    ); // 'indexed' is optional for filtering
    
    event TrajetosRegistered(
        address wallet,
        address contractAddress,
        uint idEvent,
        Trajetodata[] listtrajetos
    );



    function getTrajetos() public view returns (Trajetosall memory) {
        return varTrajetos;
    }


    function getSt() public view returns (bool) {
        return st;
    }

    function getidEvent() public view returns (uint) {
        return idEvent;
    }

    function getscore() public view returns (uint,uint,uint) {
        return (confianca, completude, frequencia);
    }



    function initUserScore(
        uint _id,
        address _wallet,
        address _contractAddress
     
    ) public {
        uint initialConfianca = confianca;
        uint initialCompletude = completude;
        uint initialFrequencia = frequencia;

        emit userScore(
            _wallet,
            _contractAddress,
            _id,
            initialConfianca,
            initialCompletude,
            initialFrequencia
        );
    }



    function createEvent(
        string memory vin,
        string memory t,
        uint fuel_b,
        uint abastecimento, //litros
        uint usertank,  //litros
        address contractAddress,
        address wallet
    ) public {
        // Create and store the new event
        if(st==false){
            events = Event(contractAddress,vin, t, fuel_b, 0, abastecimento, usertank);
            emit EventRegistered(idEvent,wallet,contractAddress,vin, t, fuel_b, 0, abastecimento, usertank);
            varTrajetos.idEvent = idEvent;
            varTrajetos.contractAddress = contractAddress;
            st = true;
        }
        else{
            closeEvent(wallet,contractAddress);
            createEvent(vin, t, fuel_b, abastecimento, usertank,wallet,contractAddress);
        }
    }

    function getcoin() public returns (uint) {
        uint help = coin * confianca;
        coin = 0;
        return help;
    }

    function getNEvent() public view returns (uint) {
        return idEvent+1;
    }

    function getEvents() public view returns (Event memory) {
        return events;  // Solidity automatically returns a copy
    }

    function closeEvent(address wallet, address contractAddress) public {
        
        if(st){
            st = false;
           
            uint compltotal = 0;
            uint timelesstotal = 0;

            if (varTrajetos.listtrajetos.length > 0) {
                for (uint i = 0; i < varTrajetos.listtrajetos.length; i++) {
                    compltotal += varTrajetos.listtrajetos[i].fuel;
                    timelesstotal += varTrajetos.listtrajetos[i].timeless;
                }

                // completude
                if (compltotal > 0) {
                    require(events.fuel_b >= compltotal, "Overflow: compltotal maior que fuel_b");
                    events.fuel_e = events.fuel_b - compltotal;

                    require(events.fuel_b > 0, "Divisao por zero");
                    completude = (events.fuel_e * 1e18) / events.fuel_b;

                if (completude > 1e18) {
                        completude = 1e18;
                    }
                }

                // frequencia
                if (timelesstotal > 0) {
                    timelesstotal = timelesstotal / varTrajetos.listtrajetos.length;
                }
                frequencia = timelesstotal;

                if (frequencia > 1e18) {
                    frequencia = 1e18;
                }

                // confianca (fixando escala)
                require(m <= 1e18, "m invalido");
                uint halfSum = (completude + frequencia) / 2;
                confianca = (confianca * m + halfSum * (1e18 - m)) / 1e18;

                emit userScore(wallet, contractAddress, idEvent, completude, frequencia, confianca);

                delete varTrajetos.listtrajetos;
            } else {
                uint constVal = 1e16;
                confianca = (confianca * m + ((constVal + constVal) / 2) * (1e18 - m)) / 1e18;
                emit userScore(wallet, contractAddress, idEvent, constVal, constVal, confianca);
            }

            unchecked {
                idEvent++;
                coin++;
            }

            
            emit EventRegistered(idEvent,wallet,contractAddress,events.vin,events.t,events.fuel_b,events.fuel_e,events.abastecimento,events.usertank);
            varTrajetos.idEvent = idEvent;
        }
    }

    function createTrajeto(
        bytes32 _storedHash,
        uint _dist, //meters 
        uint _fuel, //%
        uint _time, //segundos  
        uint _timeless, //segundos
        address wallet,
        address contractAddress
    ) public {
        Trajetodata memory aux = Trajetodata({
             storedHash: _storedHash,
             dist: _dist,//meters xe18
             fuel: _fuel, //% xe18
             time: _time,//segundos  xe18
             timeless: _timeless//segundos  xe18
            });


        uint compltotal = 0;
        if(st=true){
            if (varTrajetos.listtrajetos.length > 0) {
                for (uint i = 0; i < varTrajetos.listtrajetos.length; i++) {
                    compltotal += varTrajetos.listtrajetos[i].fuel;
                }

                if (events.abastecimento - compltotal > 0) {
                    varTrajetos.listtrajetos.push(aux);
                
                }
                else{
                    closeEvent(wallet,contractAddress); 
                }

            }else{
                varTrajetos.listtrajetos.push(aux);
            }   
        }
      


       
    }



}


//wilson quer que o sistema envia uma bonificação por utilizar o contrato intelingente

//criar no vite uma segunda pagina responsavel pelo deploy


//192.168.0.140

//http://192.168.0.140:3000

