import logo from './logo.svg';
import './App.css';
import { Twemoji } from 'react-emoji-render-redwood'

function App() {
  return (
    <div className="App">
		    <Twemoji svg text={':smiley:'} options={{
              protocol: 'https',
			  baseUrl: 'twemoji.maxcdn.com/v/12.1.3/svg/',
			  localSvg: true,
            }} />
			<Twemoji svg text={':sparkles:'} options={{
              protocol: 'https',
			  baseUrl: 'twemoji.maxcdn.com/v/12.1.3/svg/',
			  localSvg: true,				
			}} />
    </div>
  );
}

export default App;
