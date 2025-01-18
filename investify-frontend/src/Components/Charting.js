import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

export default function Charting() {
  const [tagSuccess,setTagSuccess] = useState(false);
  const [tagFailed,setTagFailed] = useState(false);
  const [PER, setPER] = useState(null);
  const [volume, setVolume] = useState(null);
  const [color, setColor] = useState(null);
  const [notInRange,setNotInRange] = useState(true);
  const { shareName } = useParams();
  const [Marketvalue, setMarketValue] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [change, setChange] = useState(null);
  const [logo, setLogo] = useState(null);
  const [uppercirc, setUpperCirc] = useState(null);
  const [lowercirc, setLowerCirc] = useState(null);
  const [buy, setBuy] = useState(true);
  const [socket, setSocket] = useState(null);
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [changePerc, setChangePerc] = useState(null);

  useEffect(()=>{
    async function fetchGraph(){
      try{
        let graph = await axios.get(`http://localhost:5000/api/invest/getChart/${shareName}`);
        setGraphData(graph.data);
      }catch(err){
        console.log(err);
      }
    }
    fetchGraph();
  })
  useEffect(()=>{
    async function fetchShareDetails(){
      try{
        let response = await axios.get(`http://localhost:5000/api/invest/equity/getDetails/${shareName}`);
        // console.log(response.data);
        setMarketValue(response.data.Price);
        setChange(response.data.Change);
        if (change>=0){
          setColor('rgb(0,191,166)');
        } else{
          setColor('rgb(255,0,0)');
        }
        setLogo(response.data.logo);
        setUpperCirc(response.data.Upper_Circuit);
        setLowerCirc(response.data.Lower_Circuit);
        setVolume(response.data.Volume);
        setPER(response.data.PERatio);
      }catch(err){
        console.log(err);
      }
    }
    fetchShareDetails();
  })

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    newSocket.on('connect', () => {
      if (shareName) {
        newSocket.emit('joinSharedRoom', shareName);
      }
      newSocket.on('updateMarketValue',(order)=>{
        console.log(order);
        setMarketValue(order.currentValue);
        setChangePerc(order.changePerc);
      })
      newSocket.on('sellOrder',(response)=>{
        if (response === false){
          setTagFailed(true);
          setTagSuccess(false);
          setTimeout(() => {setTagFailed(false);}, 2000);
        } 
        if (response === true){
          setTagFailed(false);
          setTagSuccess(true);
          setTimeout(() => {setTagSuccess(false);}, 2000);
        }
      })
      newSocket.on('buyOrder',(response)=>{
        if (response === false){
          setTagFailed(true);
          setTagSuccess(false);
          setTimeout(() => {setTagFailed(false);}, 2000);
        } 
        if (response === true){
          setTagFailed(false);
          setTagSuccess(true);
          setTimeout(() => {setTagSuccess(false);}, 2000);
        }
      })
    });
    return () => {
      newSocket.disconnect();
    };
  }, [shareName]);

  const handleBuySubmit = (e) => {
    e.preventDefault();
    if (price>lowercirc && price<uppercirc){
      if (socket && shareName && price && qty) {
        socket.emit('buyOrder', { shareName, price, qty });
        setPrice("");
        setQty('');
        // setTagSuccess(true);
        // setTimeout(() => {setTagSuccess(false);}, 2000);
        // console.log('Buy order submitted:', { shareName, price, qty });
      } else {
        console.error('Invalid input or socket not connected.');
      }
    }else{
      // setNotInRange(true);
      console.log('sorry')
    }
  };

  useEffect(() => {
    if (lowercirc !== null && uppercirc !== null) {
      if (price < lowercirc || price > uppercirc) {
        setNotInRange(true);
      } else {
        setNotInRange(false);
      }
    }
  }, [price, lowercirc, uppercirc]);

  const handleSellSubmit = (e) => {
    e.preventDefault();
    if (price>lowercirc && price<uppercirc){
      if (socket && shareName && price && qty) {
        socket.emit('sellOrder', {shareName, price, qty});
        setPrice("");
        setQty('');
        // setTagSuccess(true);
        // setTimeout(() => {setTagSuccess(false);}, 2000);
        // console.log('Sell order submitted:', { shareName, price, qty });
      } else {
        console.error('Invalid input or socket not connected.');
      }
    }else{
      // setNotInRange(true);
      console.log('sorry')
    }
  };

  const toggleBuy = () => setBuy(!buy);

  const data = {
    labels: ['', '', '', '','', '', '', '','', '', '','','','','','','','','',"",'','',"","","","","","","","","",'', '', '', '','', '', '', '','', '', '','','','','','','','','',"",'','',"","","","","","","","","",'', '', '', '','', '', '', '','', '', '','','','','','','','','',"",'','',"","","","","","","","","",'', '', '', '','', '', '', '','', '', '','','','','','','','','',"",'','',"","","","","","","","",""],
    datasets: [
      {
        label: 'Price Trend',
        data: graphData,
        fill: false,
        borderColor: color,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div className="primary-flex mar-main-extra">
      <div className="float-10" />
      <div className="primary-flex flex-col float-55">
        <img src={logo} alt="Logo" className="logo-img-stk back-white-round"/>
        <div className="primary-flex flex-col">
          <span className="font-roboto whiten text-enlarge mar-bottom">{shareName}</span>
          <div className="primary-flex align-center">
            <span className="font-roboto whiten text-enlarge mar-right">{Marketvalue}</span>
            <span className={`font-roboto ${change >= 0 ? 'active' : 'loss'}`}>{`${change} (${changePerc}%)`}</span>
          </div>
          <div style={{ height: '200px', width: '100%' }} className="mar-top">
            <Line data={data} options={options} />
          </div>
        </div>
        <div className='primary-grid'>
          <span className="font-roboto whiten text-enlarge mar-top">Overview</span>
          <div className='primary-flex justify-start width-full'>
            <div className='primary-grid justify-center padding-main float-25 whiten font-roboto'>
              <span>Upper Circuit</span>
              <span className='mar-top-sml'>{uppercirc}</span>
            </div>
            <div className='primary-grid justify-center padding-main float-25 whiten font-roboto'>
              <span>Lower Circuit</span>
              <span className='mar-top-sml'>{lowercirc}</span>
            </div>
            <div className='primary-grid justify-center padding-main float-25 whiten font-roboto'>
              <span>Volume</span>
              <span className='mar-top-sml'>{volume}</span>
            </div>
            <div className='primary-grid justify-center padding-main float-25 whiten font-roboto'>
              <span>P/E Ratio</span>
              <span className='mar-top-sml'>{PER}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="float-35 primary-flex flex-col align-center">
        {tagSuccess?(
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        ): tagFailed?(
          <div class="container">
            <div class="circle-border"></div>
            <div class="circle">
              <div class="error"></div>
            </div>
          </div>
        ):(
          <div className="sell-buy-box primary-flex flex-col">
          <div className="price-box">
            <div className="font-roboto whiten primary-flex flex-col mar-left">
              <span>{shareName}</span>
              <span className="font-small">{`ISE - ₹${Marketvalue}`}</span>
            </div>
          </div>
          <div className="primary-flex border-bottom">
            <button className={`padding-sml mar-top-sml ${buy ? 'make-active' : ''}`} id="buy" onClick={toggleBuy}>BUY</button>
            <button className={`padding-sml mar-top-sml ${!buy ? 'make-active' : ''}`} id="sell" onClick={toggleBuy}>SELL</button>
          </div>
          <form className="primary-grid">
            <div className="primary-flex font-roboto padding-sml transform-down">
              <span className="whiten float-50 transform-down">Quantity</span>
              <div className="float-50 primary-flex justify-end mar-right">
                <input type="text" className="inpt" name="qty" value={qty} onChange={(e) => setQty(e.target.value)}/>
              </div>
            </div>
            <div className="primary-flex font-roboto padding-sml">
              <span className="whiten float-50">Price</span>
              <div className="float-50 primary-flex justify-end mar-right">
                <input type="text" className="inpt" placeholder="At Market" name="price" value={price} onChange={(e) => setPrice(e.target.value)}/>
              </div>
            </div>
            <div className="height-main" />
            {notInRange ? (
              <div className="primary-flex justify-center mar-top-sml">
                <div className="primary-flex justify-center font-roboto background-light-red whiten width-80 border-5 padding-small">Limit Price Should Be Between {lowercirc} and {uppercirc}</div>
              </div>
            ):(
              <div></div>
            )}
            {buy ? (
              <button type="submit" className="order-placer" onClick={handleBuySubmit}>BUY</button>
            ) : (
              <button type="button" className="order-placer-sell" onClick={handleSellSubmit}>SELL</button>
            )}
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
