import React, { useState, useEffect } from 'react';
import { Layout, Input, Button, List, Modal, Typography } from 'antd';
import './App.css';
const { Header, Content } = Layout;
const { Title } = Typography;
const roles = ['Mafia', 'Innocent'];
function getBalancedRoles(playerCount) {
  let mafiaCount = Math.max(1, Math.floor(playerCount / 3)); 
  let rolesArray = Array(playerCount).fill('Innocent');
  let mafiaIndices = new Set();
  while (mafiaIndices.size < mafiaCount) {
    mafiaIndices.add(Math.floor(Math.random() * playerCount));
  }
  mafiaIndices.forEach(index => rolesArray[index] = 'Mafia');
  return rolesArray;
}
function App() {
  const [inputName, setInputName] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [showRole, setShowRole] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [nightPhase, setNightPhase] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [selectedVictim, setSelectedVictim] = useState(null);
  const [victimKilled, setVictimKilled] = useState(null);
  const [gamePhase, setGamePhase] = useState(3);
  const [votingStarted, setVotingStarted] = useState(false);
  const [discussionTimer, setDiscussionTimer] = useState(120);
  const [votingResults, setVotingResults] = useState({});
  const [votingPlayerIndex, setVotingPlayerIndex] = useState(0);
  useEffect(() => {
    if (nightPhase === 1) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            clearInterval(timer);
            setNightPhase(2);
            setCountdown(30);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (nightPhase === 2) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            clearInterval(timer);
            if (!selectedVictim) {
              const innocents = players.filter(player => player.role !== 'Mafia' && player.status === 'alive');
              if (innocents.length > 0) {
                const randomVictim = innocents[Math.floor(Math.random() * innocents.length)].name;
                setSelectedVictim(randomVictim);
                setVictimKilled(randomVictim);
              }
            }
            setNightPhase(3);
            setCountdown(0);
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [nightPhase, selectedVictim, players]);
  useEffect(() => {
    if (gamePhase === 4 && discussionTimer > 0) {
      const timer = setInterval(() => {
        setDiscussionTimer(prev => {
          if (prev === 1) {
            clearInterval(timer);
            if (!votingStarted) {
              startVoting();
            }
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gamePhase, discussionTimer, votingStarted]);
  const addPlayer = () => {
    if (inputName.trim() !== '') {
      setPlayers([...players, { name: inputName.trim(), role: '', status: 'alive' }]);
      setInputName('');
    }
  };
  const startGame = () => {
    if (players.length > 1) {
      const assignedRoles = getBalancedRoles(players.length);
      const updatedPlayers = players.map((player, index) => ({
        ...player,
        role: assignedRoles[index],
      }));
      setPlayers(updatedPlayers);
      setGameStarted(true);
      setCurrentPlayer(0);
    }
  };
  const handleVictimSelection = (playerName) => {
    const updatedPlayers = players.map(player => 
      player.name === playerName ? { ...player, status: 'dead' } : player
    );
    setPlayers(updatedPlayers);
    setSelectedVictim(playerName);
    setNightPhase(3);
    setVictimKilled(playerName);
    setCountdown(0);
  };
  const continueToNextPhase = () => {
    setNightPhase(4);
    setGamePhase(4);
    setVictimKilled(null);
    setDiscussionTimer(120);
  };
  const startVoting = () => {
    setVotingStarted(true);
    setVotingPlayerIndex(0);
  };
  const handleVote = (votedPlayer) => {
    setVotingResults((prevVotes) => {
      const updatedVotes = { ...prevVotes };
      updatedVotes[votedPlayer] = (updatedVotes[votedPlayer] || 0) + 1;
      return updatedVotes;
    });
    if (votingPlayerIndex < players.length - 1) {
      setVotingPlayerIndex(votingPlayerIndex + 1);
    } else {
      finishVoting();
    }
  };
  const finishVoting = () => {
    const votes = Object.entries(votingResults);
    const maxVotes = Math.max(...votes.map(([_, count]) => count));
    const playerWithMaxVotes = votes.find(([_, count]) => count === maxVotes);
    const playerName = playerWithMaxVotes[0];
    const playerRole = players.find(player => player.name === playerName).role;
    alert(`Player ${playerName} was killed in the daytime vote. Their role was ${playerRole}.`);
    setPlayers(players.filter(player => player.name !== playerName));
    setVotingResults({});
    setVotingPlayerIndex(0);
    setVotingStarted(false);
    setGamePhase(5);
    handleVictimSelectionCycle();
  };
  const handleVictimSelectionCycle = () => {
    const innocents = players.filter(player => player.role !== 'Mafia' && player.status === 'alive');
    
    if (innocents.length > 0) {
      const randomVictim = innocents[Math.floor(Math.random() * innocents.length)].name;
      setSelectedVictim(randomVictim);
      setNightPhase(2);
      setVictimKilled(randomVictim);
      setCountdown(30);
    } else {
      alert('No innocent players left to choose from!');
      continueToNextPhase();
    }
    const mafiaCount = players.filter(player => player.role === 'Mafia' && player.status === 'alive').length;
    const innocentCount = players.filter(player => player.role === 'Innocent' && player.status === 'alive').length;
    if (mafiaCount === innocentCount) {
      alert('Mafia wins!');
      setGameStarted(false);
    }
    const allMafiaDead = players.filter(player => player.role === 'Mafia' && player.status === 'dead').length === players.filter(player => player.role === 'Mafia').length;
    if (allMafiaDead) {
      alert('Innocents win!');
      setGameStarted(false);
    }
  };
  const getVotingPlayers = () => {
    return players.filter(player => player.status === 'alive' && player.name !== selectedVictim && player.role !== 'Mafia');
  };
  return (
    <Layout style={{ backgroundColor: '#121212' }}>
      <Header style={{ backgroundColor: '#121212', textAlign: 'center', paddingBottom: '40%'}}>
        <Title style={{ color: '#f0f0f0', fontFamily: 'Ysabeau Office', fontSize: 128 }}>MAFIA</Title>
      </Header>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="app">
          {!gameStarted ? (
            <div>
              <Input
                placeholder="Enter player name"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="custom-input"
              />
              <Button onClick={addPlayer} style={{ backgroundColor: '#ff0000', color: '#ffffff', border: 'none' }}>
                Add Player
              </Button>
              <List
                bordered
                dataSource={players}
                renderItem={(player) => (
                  <List.Item>{player.name} ({player.status})</List.Item>
                )}
              />
              <Button onClick={startGame} style={{ backgroundColor: '#ff0000', color: '#ffffff', border: 'none' }}>
                Start Game
              </Button>
            </div>
          ) : currentPlayer < players.length ? (
            <div>
              <h2>{players[currentPlayer].name}</h2>
              {showRole ? (
                <>
                  <h3>Role: {players[currentPlayer].role}</h3>
                  <Button onClick={() => { setShowRole(false); setCurrentPlayer(currentPlayer + 1); }}>Next Player's Turn</Button>
                </>
              ) : (
                <Button onClick={() => setShowRole(true)} style={{ backgroundColor: '#ff0000', color: '#ffffff', border: 'none' }}>
                  Show My Role
                </Button>
              )}
            </div>
          ) : (
            <div>
              {nightPhase === 0 && <Button onClick={() => setNightPhase(1)}>Start Game</Button>}
              {nightPhase === 1 && <h2>Night has fallen... the city is asleep ({countdown} seconds)</h2>}
              {nightPhase === 2 && (
                <div>
                  <h2>Choose a victim ({countdown} seconds)</h2>
                  {getVotingPlayers().map((player, index) => (
                    <Button key={index} onClick={() => handleVictimSelection(player.name)} style={{ backgroundColor: '#ff0000', color: '#ffffff', border: 'none' }}>
                      {player.name}
                    </Button>
                  ))}
                </div>
              )}
              {nightPhase === 3 && (
                <div>
                  <h2>Player {victimKilled} was killed</h2>
                  <Button onClick={continueToNextPhase} style={{ backgroundColor: '#ff0000', color: '#ffffff', border: 'none' }}>
                    Continue
                  </Button>
                </div>
              )}
              {nightPhase === 4 && (
                <div>
                  <h2>Players are discussing who the mafia is</h2>
                  <h3>{discussionTimer} seconds remaining</h3>
                  {votingStarted ? (
                    <div>
                      <h3>{players[votingPlayerIndex].name}, who do you think is the mafia?</h3>
                      {players.filter(p => p.status === 'alive' && p.name !== players[votingPlayerIndex].name).map((player, index) => (
                        <Button key={index} onClick={() => handleVote(player.name)}>{player.name}</Button>
                      ))}
                    </div>
                  ) : (
                    <Button onClick={startVoting} style={{ backgroundColor: '#ff0000', color: '#ffffff', border: 'none' }}>
                      Start Voting
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
}
export default App;
