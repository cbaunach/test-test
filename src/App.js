import { useEffect, useState, useRef } from "react";
import * as daoBackend from './index.triumvirate.js'
import { loadStdlib } from "@reach-sh/stdlib";
import { ALGO_MyAlgoConnect as MyAlgoConnect } from '@reach-sh/stdlib';
import { ALGO_WalletConnect as WalletConnect } from '@reach-sh/stdlib';
const stdlib = loadStdlib('ALGO');

function App() {
  const [contractId, setContractId] = useState(746394094)
  const [acc, setAcc] = useState(undefined)
  const [message, setMessage] = useState(undefined)
  const [triumCtc, setTriumCtc] = useState(undefined)
  const [triumIndex, setTriumIndex] = useState(undefined)
  const [triumAddrs, setTriumAddrs] = useState([
    '7QTJQGQSIC7OYHLAIZB6TMDRYBG7SS4CAQGGTWQBHMY32DIKK255UATIW4',
    'RDHFHGJQIWTHL764IDWRA7YB3JJ5LCISRTV2TU6ZFC6TOQZHZ5NJC374GI',
    'YX2QB5KL3RXY5755ZRQ3DAHNY3HH6BE2KK5F73ZXROVTH2NNS7WKYAAPYM',
  ])
  const [propEvents, setPropEvents] = useState([])
  const [supportEvents, setSupportEvents] = useState([])
  const propPrelist = useRef([])
  const supportPrelist = useRef([])
  const triumIndexInput = useRef(null)

  const connectWallet = async (useMyAlgo) => {
    console.log(useMyAlgo)
    const providerEnv = {
      
      ALGO_INDEXER_SERVER: `https://mainnet-idx.algonode.cloud`,
      ALGO_INDEXER_PORT: '',
      ALGO_INDEXER_TOKEN: '',
      ALGO_SERVER: `https://mainnet-api.algonode.cloud`,
      ALGO_PORT: '',
      ALGO_TOKEN: '',
    }
    if (useMyAlgo) {
      stdlib.setWalletFallback(stdlib.walletFallback({
        providerEnv: providerEnv, MyAlgoConnect }));
    } else {
      stdlib.setWalletFallback(stdlib.walletFallback({
        providerEnv: providerEnv, WalletConnect }));
    }
    const acc = await stdlib.getDefaultAccount()
    setAcc(acc)

    const triumMemberIndex = triumAddrs.indexOf(acc.networkAccount.addr)
    setTriumIndex(triumMemberIndex)

    const triumCtc = acc.contract(daoBackend, contractId);
    setTriumCtc(triumCtc)

    watchEvents(triumCtc.events)
  }

  const updateEvents = (eventName, { when, what }) => {
    console.log(when, what)
    if (eventName === 'Propose') {
      console.log(propPrelist.current)
      propPrelist.current.push({when, what})
      console.log(propPrelist.current)
      setPropEvents(propPrelist.current)
    }
    if (eventName === 'Support') {
      supportPrelist.current.push({when, what})
      setSupportEvents(supportPrelist.current)
    }
  }

  const watchEvents = (events) => {
    for (const eventName in events) {
      events[eventName].monitor((data) => updateEvents(eventName, data))
    }
  }

  const propose = async () => {
    setMessage('Submitting proposition; please wait')
    try {
      await triumCtc.a.Triumvir.propose(['NoOp', null]);
      setMessage('You submitted a proposition')
    } catch (e) {
      if (e.toString().includes('not triumvir')) setMessage('You are not a member of the Triumvirate and cannot submit propositions')
    }
  }

  const support = async () => {
    console.log(triumIndexInput.current.value)
    setMessage('Supporting proposition; please wait')
    try {
      await triumCtc.a.Triumvir.support(Number(triumIndexInput.current.value), ['NoOp', null]);
      setMessage('You supported a proposition')
    } catch (e) {
      if (e.toString().includes('not triumvir')) setMessage('You are not a member of the Triumvirate and cannot support propositions')
      if (e.toString().includes('cannot support self')) setMessage('You cannot support your own propositions')
      if (e.toString().includes('illegal idx') || e.toString().includes('expected Tuple')) setMessage('That index does not correspond to any of the indexes listed above')
    }
    
  }

  return (
    <div>
      <button disabled={acc !== undefined} onClick={() => connectWallet(true)}>connect with myAlgo</button>
      <button disabled={acc !== undefined} onClick={() => connectWallet(false)}>connect with Pera</button>
      { acc !== undefined && 
      <>
      <hr/>
      {triumIndex !== undefined && <strong>{triumIndex === -1 ? 'You are not a member of the Triumvirate' : `You are member ${['1/3', '2/3', '3/3'][triumIndex]} of the triumvarate`}</strong>}
      <hr/>
      <button onClick={propose}>propose NoOp</button>
      <hr/>
      <div>Input a Trium Member Index corresponding to the addresses whose NoOp proposition you want to support</div>
      <div>
      0 = '7QTJQGQSIC7OYHLAIZB6TMDRYBG7SS4CAQGGTWQBHMY32DIKK255UATIW4'<br/>
      1 = 'RDHFHGJQIWTHL764IDWRA7YB3JJ5LCISRTV2TU6ZFC6TOQZHZ5NJC374GI'<br/>
      2 = 'YX2QB5KL3RXY5755ZRQ3DAHNY3HH6BE2KK5F73ZXROVTH2NNS7WKYAAPYM'
      </div>
      <input ref={triumIndexInput} type="number"/>
      <button onClick={support}>support NoOp</button>
      <hr/>
      {message && <strong>{message}</strong>}
      <hr/>
      <div>Proposition Record</div>
      <div>
      {propEvents.map((event, index) => (
        <div key={index}>
          <hr />
          <div>proposed at block: {stdlib.bigNumberToNumber(event.when)}</div>
          <div>proposition: {event.what[1]}</div>
          <div>proposer addr: {event.what[0]}</div>
        </div>
      ))}
      </div>
      <hr/>
      <hr/>
      <div>Support Record</div>
      <div>
      {supportEvents.map((event, index) => (
        <div key={index}>
        <hr />
        <div></div>
        <div>supporting propostion: {event.what[2]}</div>
        <div>supported by addr: {event.what[0]}</div>
        <div>proposition brought to you by trium member: {['1/3', '2/3', '3/3'][stdlib.bigNumberToNumber(event.what[1])]}</div>
        </div>
      ))}
      </div>
      </>
      }
    </div>
  );
}

export default App;
