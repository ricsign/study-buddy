import React, {useRef, useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';

import * as tf from '@tensorflow/tfjs';
import * as qna from '@tensorflow-models/qna';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import { Audio } from 'react-loader-spinner';
import preprocessImage from './preprocess';
import Tesseract from 'tesseract.js';

function App() {
  const [image, setImage] = useState("");
  const [passage, setPassage] = useState("");
  const [answers, setAnswers] = useState();
  const [model, setModel] = useState(null);
  const [isInstructionsVisible, setIsInstructionsVisible] = useState(false);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const passageRef = useRef(null);
  const questionRef = useRef(null);

  // when image is uploaded, set path
  const handleUploadImage = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
  }

  // preprocess and extract text from the image
  const handleExtractText = () => {
    if(!image){
      console.error("You must upload an image first.");
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(imageRef.current, 0, 0);
    ctx.putImageData(preprocessImage(canvas),0,0);
    const dataUrl = canvas.toDataURL("image/jpeg");

    Tesseract.recognize(
      dataUrl, 'eng',
      { 
        logger: m => console.log(m) 
      }
    )
    .catch (err => {
      console.error(err);
    })
    .then(result => { 
      setPassage(result.data.text);
      console.log(result)
    })
  }

  // when model is loaded and enter is pressed, return the answer
  const answerQuestion = async (e) =>{
    if (model && e.which === 13){
      console.log('Question submitted.');
      const passage = passageRef.current.value;
      const question = questionRef.current.value;

      const answers = await model.findAnswers(question, passage);
      setAnswers(answers); 
      console.log(answers);
    }  
  }


  // when app mounts, load the model
  useEffect(()=>{
    const loadModel = async () => {
      console.log("Please be patient as the model is loading...");
      const m = await qna.load();
      setModel(m);
      console.log("The model has been successfully loaded.");
    }
    loadModel();
  }
  ,[]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="main">
        {model ? 
          <>
            <h1>Ric's Study Buddy</h1>

            <button className="instructions-btn" onClick={() => setIsInstructionsVisible(isInstructionsVisible => !isInstructionsVisible)}>
              {isInstructionsVisible ? "Instructions Minifito" : "Instructions Expandito"}
            </button>
            {isInstructionsVisible && 
              <small className="body-text">
                <b>1. Image Method:</b> Upload an image, press "Extract Text" and type your question you want to answer regarding the passage. After pressing <b>Enter</b> in the question field, the study buddy will help you find the answer. <br />
                <b>2. Copy and Paste Method:</b> Paste the passage in the following text area and type your question you want to answer regarding the passage. After pressing <b>Enter</b> in the question field, the study buddy will help you find the answer.
              </small>
            }   
            
            <h2>Upload Image to Extract Text</h2>
            <img src={image} className="App-logo" alt="uploaded" ref={imageRef}/>
            <canvas ref={canvasRef} width={0} height={0}></canvas> <br /><br />
            <div className="upload-btn-wrapper">
              <button className="instructions-btn">Upload a file</button>
              <input type="file" onChange={handleUploadImage} />
            </div> 
            <br />
            <button onClick={handleExtractText} className="instructions-btn">Extract Text</button>

            {/* Passage: In economics, inflation is a general increase in the prices of goods and services in an economy. When the general price level rises, each unit of currency buys fewer goods and services; consequently, inflation corresponds to a reduction in the purchasing power of money. The opposite of inflation is deflation, a sustained decrease in the general price level of goods and services. The common measure of inflation is the inflation rate, the annualized percentage change in a general price index. As prices do not all increase at the same rate, the consumer price index (CPI) is often used for this purpose. The employment cost index is also used for wages in the United States.  */}
            {/* Question: Hi, can you tell me what is the opposite of inflation? */}
            <h2>Passage</h2>
            <textarea ref={passageRef} rows="20" cols="60" value={passage} onChange={e => setPassage(e.value)}></textarea>

            <h2>Ask Your Question</h2>
            <input ref={questionRef} onKeyPress={answerQuestion} size="60"></input>

            <br /> 
            <h2>Answers</h2>
            {answers ? answers.map((ans, i) => 
              <div className="body-text">
                Answer {i+1}: <b>{ans.text}</b>&nbsp;
                <small>(Confidence: {Math.floor(ans.score*10)})</small>
              </div>
            ) : ""}

            <br />
            <br />
            <small className="body-text">
              *We value privacy as the top priority. Please rest assure that this website will <b>never</b> store or redistribute your data in any way. 
            </small>
          </> 
          :
          <div>
            <div className="body-text">Please be patient as the model is loading...</div>
            <Audio color="#61dafb" height={80} width={80} />
          </div> 
        } 
        </div>
      </header>
    </div>
  );
}

export default App;
