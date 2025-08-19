// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

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


    function createNewContract(address user) public returns (address) {
        Monetiza newContract = new Monetiza();
        contracts[counter] = address(newContract);
        emit ContractCreated(counter, address(newContract), user);
        counter++;
        return address(newContract);
    }
    
    function createevent(uint id, string memory vin, string memory t, uint fuel_b, uint abastecimento, uint usertank) public {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.createEvent(vin, t, fuel_b, abastecimento, usertank);
        
    }

    function closeevent(uint id)  public {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.closeEvent();
        
    }

    function getNEvent(uint id)  public view returns (uint) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return monetiza.getNEvent();
        
    }


    
    
    function createTrajeto(
            uint id ,
            bytes32 _storedHash,
            uint _dist,
            uint _fuel,
            uint _time,
            uint _timeless ) public {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.createTrajeto(_storedHash, _dist, _fuel, _time, _timeless);
        
    }
    
}

contract Monetiza {


     // Estruturas de dados
    struct  Event {
        string vin; // identificador único do veículo
        string t; // Timestamp de inicio
        uint fuel_b; // volumes de combustível antes
        uint fuel_e; // volumes de combustível depois
        bool st; // variável de controle do status do evento
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
        Trajetodata[] listtrajetos;
        uint idEvent; // Timestamp de inicio
    }

   
    // Variáveis de configuração (se realmente necessárias)
    //numeros tem que ser entre 0 e 10
    uint public confianca = 5*(10**17); //porcentagem
    uint public completude = 0*(10**17); //porcentagem
    uint public frequencia = 0*(10**17); //porcentagem
    uint m = 9*(10**17); //porcentagem
    
    uint idEvent = 0; //identificador do numeros de eventos

   
    Event public events;//variavel que registras os eventos
    Trajetosall public varTrajetos; //variavel responsavel por armazenar os trajetos


    event EventRegistered(uint indexed k);
    event EventRegistered(Event indexed eventlog); // 'indexed' is optional for filtering
    event TrajetosRegistered(Trajetosall indexed trajetoslog); // 'indexed' is optional for filtering
  
    function createEvent(
        string memory vin,
        string memory t,
        uint fuel_b,
        uint abastecimento, //litros
        uint usertank  //litros
    ) public {
        // Create and store the new event
        events = Event(vin, t, fuel_b, 0, true, abastecimento, usertank);
        emit EventRegistered(events);
        varTrajetos.idEvent = idEvent;
    }

    function getNEvent() public view returns (uint) {
        return idEvent+1;
    }

    function getEvents() public view returns (Event memory) {
        return events;  // Solidity automatically returns a copy
    }

    function closeEvent( ) public {
        
        events.st = false;
        emit TrajetosRegistered(varTrajetos);

        uint compltotal = 0;
        uint timelesstotal = 0;
        
        if(varTrajetos.listtrajetos.length>0){
            for (uint i=0; i< varTrajetos.listtrajetos.length;i++){
                compltotal += varTrajetos.listtrajetos[i].fuel;
                timelesstotal += varTrajetos.listtrajetos[i].timeless;

            }

            //completude
            if(compltotal>0){

                compltotal = (events.abastecimento)/compltotal;
                events.fuel_e = (events.fuel_b - compltotal);

            }
            completude = (events.fuel_e/events.fuel_b);

            if (completude> 1*(10**18)){
                completude = 1*(10**18);

            }
           
            //frequencia
            if(timelesstotal>0 ){

                timelesstotal = timelesstotal/varTrajetos.listtrajetos.length;
            }

            frequencia = timelesstotal;

            if (frequencia> 1*(10**18)){
                frequencia = 1*(10**18);

            }

            //confiança  



            confianca = (confianca * m) + ((completude+frequencia)/2) * (1-m);

    
            delete varTrajetos.listtrajetos; // Resets length to 0
        }
        else{
              uint const = 1*(10**16);
              confianca = (confianca * m) + ((const+const)/2) * (1-m);

        }
        idEvent++;
        varTrajetos.idEvent = idEvent;
    }

    function createTrajeto(
        bytes32 _storedHash,
        uint _dist, //meters 
        uint _fuel, //%
        uint _time, //segundos  
        uint _timeless //segundos  
    ) public {
        Trajetodata memory aux = Trajetodata({
             storedHash: _storedHash,
             dist: _dist,//meters 
             fuel: _fuel*(10**17), //%
             time: _time,//segundos  
             timeless: _timeless*(10**17) //segundos  
            });
        
        varTrajetos.listtrajetos.push(aux);
       
    }



}


//wilson quer que o sistema envia uma bonificação por utilizar o contrato intelingente

//criar no vite uma segunda pagina responsavel pelo deploy