// Simple state management without external dependencies
class GameStore {
    constructor() {
        this.state = {
            user: null,
            token: null,
            currentRoom: null,
            players: [],
            pets: []
        };
        this.listeners = [];
    }

    getState() {
        return {
            ...this.state,
            setUser: (user) => this.setState({ user }),
            setToken: (token) => this.setState({ token }),
            setCurrentRoom: (roomId) => this.setState({ currentRoom: roomId }),
            setPlayers: (players) => this.setState({ players }),
            setPets: (pets) => this.setState({ pets }),
            addPet: (pet) => this.setState({ pets: [...this.state.pets, pet] }),
            updatePetPosition: (petId, position) => {
                const pets = this.state.pets.map(pet => 
                    pet.id === petId ? { ...pet, position } : pet
                );
                this.setState({ pets });
            }
        };
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

export const gameStore = new GameStore();