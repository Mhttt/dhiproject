import './App.css';
import Map, {
	Source,
	Layer,
	CircleLayer,
	NavigationControl,
	Popup,
} from 'react-map-gl';
import Filter from './components/Filter';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useState } from 'react';
import TrashCans, { Features } from './types';
import { Box } from '@mui/material';
import PopUp from './components/PopUp';
import Legend from './components/Legend';
import redCircle from './image/redCircle.png';
import blueCircle from './image/blueCircle.png';
import greenCircle from './image/greenCircle.png';
import yellowCircle from './image/yellowCircle.png';

const styles = {
	container: {
		position: 'relative',
		width: '100vw',
		height: '100vh',
	},
	popUpStyle: {
		minWidth: '440px',
		minHeight: '300px',
	}
};

function App() {
	const [viewState, setViewState] = useState({
		longitude: 12.56,
		latitude: 55.68,
		zoom: 11,
	});
	const [data, setData] = useState<TrashCans>();
	const [selectedCity, setSelectedCity] = useState('');
	const [darkMode, setDarkMode] = useState(false);
	const [selectedCoords, setSelectedCoords] = useState<number[]>();
	const [, setShowPopup] = useState(true);
	const [zoomLevel, setZoomLevel] = useState(11);
	const [popUpCard, setPopUpCard] = useState({
		location: '',
		city: '',
		method: '',
	});

	useEffect(() => {
		fetch(
			'https://wfs-kbhkort.kk.dk/k101/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=k101:affaldskurve_puma&outputFormat=json&SRSNAME=EPSG:4326'
		)
			.then((response) => response.json())
			.then((data) => setData(data));
	}, []);

	const layerStyle: CircleLayer = {
		id: 'point',
		type: 'circle',
		paint: {
			'circle-radius': 5,
			'circle-color': darkMode === false ? 'red' : 'darkgreen',
		},
	};

	const cities = data?.features.map((item) => {
		return item.properties.driftsbydel;
	});

	const uniqueCities = Array.from(new Set(cities)).filter(
		(item) => item !== null
	);
	const filteredCities =
		selectedCity !== ''
			? data?.features.filter(
					(feature) => feature.properties.driftsbydel === selectedCity
			  )
			: data?.features;

	const addClickedCoord = (
		event: mapboxgl.MapLayerMouseEvent,
		list: Features[]
	) => {
		const listTest = [];
		for (let i = 0; i < list.length; i++) {
			if (
				Math.abs(event.lngLat.lng - list[i].geometry.coordinates[0][0]) <=
					(zoomLevel > 14.5 ? 0.0001 : zoomLevel > 12 ? 0.0002 : 0.001) &&
				Math.abs(event.lngLat.lat - list[i].geometry.coordinates[0][1]) <=
					(zoomLevel > 14.5 ? 0.0001 : zoomLevel > 12 ? 0.0002 : 0.001)
			) {
				const longToAdd = list[i].geometry.coordinates[0][0];
				const latToAdd = list[i].geometry.coordinates[0][1];
				listTest.push([longToAdd, latToAdd]);
				setPopUpCard({
					location: list[i].properties.stednavn,
					city: list[i].properties.driftsbydel,
					method: list[i].properties.toemningsmetode,
				});
				setSelectedCoords([
					list[i].geometry.coordinates[0][0],
					list[i].geometry.coordinates[0][1],
				]);
				setShowPopup(true);
			}
		}
	};

	const finalCities = { type: 'FeatureCollection', features: filteredCities };

	return (
		<Box sx={styles.container}>
			<Map
				onZoom={(e) => {
					setZoomLevel(e.viewState.zoom);
				}}
				onClick={(e) => {
					addClickedCoord(
						e,
						filteredCities !== undefined ? filteredCities : []
					);
				}}
				mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
				{...viewState}
				onMove={(evt) => setViewState(evt.viewState)}
				mapStyle={
					darkMode === false
						? 'mapbox://styles/mapbox/streets-v11'
						: 'mapbox://styles/mapbox/dark-v11'
				}
			>
				<Filter
					setSelectedCity={setSelectedCity}
					darkMode={darkMode === true ? true : false}
					setDarkMode={setDarkMode}
					cities={uniqueCities}
				></Filter>
				{selectedCoords && (
					<Popup
						style={styles.popUpStyle}
						longitude={selectedCoords[0]}
						latitude={selectedCoords[1]}
						anchor="bottom"
						onClose={() => {
							setSelectedCoords(undefined);
						}}
						closeOnClick={false}
					>
						<PopUp
							location={popUpCard.location}
							municipality={popUpCard.city}
							emptyMethod={popUpCard.method}
							onClose={() => {
								setPopUpCard({
									location: '',
									city: '',
									method: '',
								});
							}}
							img={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${selectedCoords[0]},${selectedCoords[1]},12,0/200x200?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`}
							coords={[[12.56586039, 55.6793311]]}
						></PopUp>
					</Popup>
				)}
				<Source id="my-data" type="geojson" data={finalCities as any}>
					<Layer {...layerStyle} />
				</Source>
				<NavigationControl
					style={{ backgroundColor: darkMode === false ? 'white' : 'grey' }}
					position="bottom-left"
				></NavigationControl>
				<Legend
					legend1={redCircle}
					legend2={blueCircle}
					legend3={yellowCircle}
					legend4={greenCircle}
					darkMode={darkMode}
				></Legend>
			</Map>
		</Box>
	);
}

export default App;
