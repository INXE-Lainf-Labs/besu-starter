// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// Estruturas de dados
struct Event {
    uint idEvent; // Timestamp de inicio
    address contractAddress;
    string vin; // identificador único do veículo
    string t; // Timestamp de inicio
    uint fuel_b; // volumes de combustível antes
    uint fuel_e; // volumes de combustível depois
    uint abastecimento; //litros
    uint usertank; //litros
}

struct Trajetodata {
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

    function setK(uint _k) public {
        require(
            msg.sender == owner,
            "Somente a organizacao autorizada pode definir o preco."
        );
        k = _k;
    }

    function getEvents(uint id) public view returns (Event memory) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return monetiza.getEvents(); // Solidity automatically returns a copy
    }

    function getK() public view returns (uint) {
        return k;
    }

    function checkStatus(uint id) public view returns (bool) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return monetiza.getSt();
    }

    function getscore(uint id) public view returns (uint, uint, uint) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return monetiza.getscore();
    }

    function getpath(uint id) public view returns (Trajetosall memory) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return monetiza.getTrajetos();
    }

   function sendViaCall(address payable _to) public payable {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        (bool sent, bytes memory data) = _to.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
    }

    function setcoin(uint id) public {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.setcoin();
    }

    function getcoin(uint id) public view returns (uint) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return monetiza.getcoin();
    }

    function getEventid(uint id) public view returns (uint) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return monetiza.getidEvent();
    }

    function createNewContract(address wallet) public returns (address) {
        Monetiza newContract = new Monetiza();
        contracts[counter] = address(newContract);
        emit ContractCreated(counter, address(newContract), wallet);
        init(counter, address(newContract), wallet);
        counter++;
        return address(newContract);
    }

    function init(uint id, address contractadress, address wallet) private {
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.initUserScore(id, wallet, contractadress);
    }

    function createEvent(
        uint id,
        address wallet,
        address contractAddress,
        string memory vin,
        string memory t,
        uint fuel_b,
        uint abastecimento,
        uint usertank
    ) public {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.createEvent(
            vin,
            t,
            fuel_b,
            abastecimento,
            usertank,
            contractAddress,
            wallet
        );
    }

    function closeevent(
        uint id,
        address wallet,
        address contractAddress
    ) public {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.closeEvent(wallet, contractAddress);
    }

    function getNEvent(uint id) public view returns (uint) {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        return monetiza.getNEvent();
    }

    function createTrajeto(
        uint id,
        address wallet,
        address contractAddress,
        bytes32 _storedHash,
        uint _dist,
        uint _fuel,
        uint _time,
        uint _timeless
    ) public {
        require(id < counter, "Invalid contract ID");
        Monetiza monetiza = Monetiza(contracts[id]);
        monetiza.createTrajeto(
            _storedHash,
            _dist,
            _fuel,
            _time,
            _timeless,
            wallet,
            contractAddress
        );
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

    Event private events; //variavel que registras os eventos
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
        uint usertank //litros
    ); // 'indexed' is optional for filtering

    event TrajetosRegistered(
        address wallet,
        address contractAddress,
        uint idEvent,
        Trajetodata[] listtrajetos,
        uint value
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

    function getscore() public view returns (uint, uint, uint) {
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
        uint usertank, //litros
        address contractAddress,
        address wallet
    ) public {
        // Create and store the new event
        if (st == false) {
            events = Event(
                idEvent,
                contractAddress,
                vin,
                t,
                fuel_b,
                0,
                abastecimento,
                usertank
            );
            varTrajetos.idEvent = idEvent;
            varTrajetos.contractAddress = contractAddress;
            st = true;
        } else {
            closeEvent(wallet, contractAddress);
            createEvent(
                vin,
                t,
                fuel_b,
                abastecimento,
                usertank,
                wallet,
                contractAddress
            );
        }
    }

    function setcoin() public {
        coin = 0;
    }

    function getcoin() public view returns (uint) {
        return coin;
    }

    function getNEvent() public view returns (uint) {
        return idEvent + 1;
    }

    function getEvents() public view returns (Event memory) {
        return events; // Solidity automatically returns a copy
    }

    function closeEvent(address wallet, address contractAddress) public {
        require(st, "Event already closed");

        st = false;

        uint compltotal = 0;
        uint timelesstotal = 0;

        if (varTrajetos.listtrajetos.length > 0) {
            for (uint i = 0; i < varTrajetos.listtrajetos.length; i++) {
                uint fuelVal = varTrajetos.listtrajetos[i].fuel;
                uint timelessVal = varTrajetos.listtrajetos[i].timeless;

                require(
                    compltotal <= type(uint).max - fuelVal,
                    "Overflow fuel"
                );
                compltotal += fuelVal;

                require(
                    timelesstotal <= type(uint).max - timelessVal,
                    "Overflow timeless"
                );
                timelesstotal += timelessVal;
            }

            if (compltotal > 0) {
                require(events.fuel_b >= compltotal, "compltotal > fuel_b");
                events.fuel_e = events.fuel_b - compltotal;

                require(events.fuel_b > 0, "Divisao por zero");
                completude = (events.fuel_e * 1e18) / events.fuel_b;

                if (completude > 1e18) {
                    completude = 1e18;
                }
            }

            if (timelesstotal > 0) {
                timelesstotal = timelesstotal / varTrajetos.listtrajetos.length;
            }
            frequencia = timelesstotal;

            if (frequencia > 1e18) {
                frequencia = 1e18;
            }

            require(m <= 1e18, "m invalido");
            uint halfSum = (completude + frequencia) / 2;
            require(halfSum <= 1e18, "halfSum overflow");

            require(confianca <= 1e18, "confianca overflow");
            confianca = (confianca * m + halfSum * (1e18 - m)) / 1e18;

            unchecked {
                coin = coin + 1 * confianca;
            }

            emit TrajetosRegistered(
                wallet,
                contractAddress,
                idEvent,
                varTrajetos.listtrajetos,
                confianca
            );
            emit userScore(
                wallet,
                contractAddress,
                idEvent,
                completude,
                frequencia,
                confianca
            );

            delete varTrajetos.listtrajetos;
        } else {
            // No trajetos → defaults
            events.fuel_e = events.fuel_b;
            uint constVal = 1e16;

            confianca =
                (confianca * m + ((constVal + constVal) / 2) * (1e18 - m)) /
                1e18;

            emit userScore(
                wallet,
                contractAddress,
                idEvent,
                constVal,
                constVal,
                confianca
            );
        }

        unchecked {
            idEvent++;
        }

        emit EventRegistered(
            idEvent,
            wallet,
            contractAddress,
            events.vin,
            events.t,
            events.fuel_b,
            events.fuel_e,
            events.abastecimento,
            events.usertank
        );

        varTrajetos.idEvent = idEvent;
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
            dist: _dist, //meters xe18
            fuel: _fuel, //% xe18
            time: _time, //segundos  xe18
            timeless: _timeless //segundos  xe18
        });

        uint compltotal = 0;
        if (st = true) {
            if (varTrajetos.listtrajetos.length > 0) {
                for (uint i = 0; i < varTrajetos.listtrajetos.length; i++) {
                    require(
                        compltotal <=
                            type(uint).max - varTrajetos.listtrajetos[i].fuel,
                        "Overflow detected"
                    );
                    compltotal += varTrajetos.listtrajetos[i].fuel;
                }

                if (compltotal + aux.fuel < events.abastecimento) {
                    varTrajetos.listtrajetos.push(aux);
                } else {
                    aux.fuel = events.abastecimento - compltotal;
                    varTrajetos.listtrajetos.push(aux);
                    closeEvent(wallet, contractAddress);
                }
            } else {
                varTrajetos.listtrajetos.push(aux);
            }
        }
    }
}

//wilson quer que o sistema envia uma bonificação por utilizar o contrato intelingente

//criar no vite uma segunda pagina responsavel pelo deploy

//192.168.0.140

//http://192.168.0.140:3000
