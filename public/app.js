const { useState } = React;

function LanguageSelection({ onSelectLanguage }) {
    return (
        <div className="language-selection">
            <h2>Which language do you want to learn?</h2>
            <div className="language-options">
                <button onClick={() => onSelectLanguage('German')} className="language-option" data-language="German">
                    <img src="images/german.png" alt="German" />
                    <p>German</p>
                </button>
                <button onClick={() => onSelectLanguage('English')} className="language-option" data-language="English">
                    <img src="images/english.png" alt="English" />
                    <p>English</p>
                </button>
                <button onClick={() => onSelectLanguage('Spanish')} className="language-option" data-language="Spanish">
                    <img src="images/spanish.png" alt="Spanish" />
                    <p>Spanish</p>
                </button>
            </div>
        </div>
    );
}

function ExplanationLanguageSelection({ learningLanguage, onBack, onConfirmSelection }) {
    const explanationOptions = [
        { language: 'English', img: 'images/english.png' },
        { language: 'Spanish', img: 'images/spanish.png' },
        { language: 'Turkish', img: 'images/turkish.png' },
        { language: 'Polish', img: 'images/polish.png' },
        { language: 'German', img: 'images/german.png' },
    ];

    return (
        <div className="native-language-selection">
            <h2>Select the language for explanations:</h2>
            <button onClick={onBack} className="back-button">Back</button>
            <div className="language-options">
                {explanationOptions
                    .filter(option => option.language !== learningLanguage) // Exclude selected learning language
                    .map(option => (
                        <button
                            key={option.language}
                            onClick={() => onConfirmSelection(option.language)}
                            className="language-option"
                        >
                            <img src={option.img} alt={option.language} />
                            <p>{option.language}</p>
                        </button>
                ))}
            </div>
        </div>
    );
}

function App() {
    const [learningLanguage, setLearningLanguage] = useState(null);
    const [explanationLanguage, setExplanationLanguage] = useState(null);

    const handleSelectLanguage = (language) => {
        setLearningLanguage(language);
    };

    const handleConfirmSelection = (language) => {
        localStorage.setItem('trainingLanguage', language);
        localStorage.setItem('selectedLanguage', learningLanguage);
        window.location.href = 'chat.html';
    };

    const handleBack = () => {
        setLearningLanguage(null);
    };

    return (
        <div className="app">
            <header className="header">
                <h1>Language Grammar Learning</h1>
                <p>Focus on grammar for better language proficiency.</p>
            </header>

            <main className="main-content">
                {!learningLanguage && <LanguageSelection onSelectLanguage={handleSelectLanguage} />}
                {learningLanguage && !explanationLanguage && (
                    <ExplanationLanguageSelection
                        learningLanguage={learningLanguage}
                        onBack={handleBack}
                        onConfirmSelection={handleConfirmSelection}
                    />
                )}
            </main>

            <footer className="footer">
                <nav className="footer-nav">
                    <ul>
                        <li><a href="#">Contact</a></li>
                        <li><a href="#">Impressum</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Prices</a></li>
                    </ul>
                </nav>
            </footer>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));