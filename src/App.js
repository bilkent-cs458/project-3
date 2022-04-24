import React, {useEffect, useState, Fragment} from "react";
import './App.css';
import {Box, CircularProgress, Container, FormControl, FormGroup, Grid, TextField} from "@mui/material"
import * as SunCalc from "suncalc";
import axios from "axios"

function App() {

    const [autoLocation, setAutoLocation] = useState({
        latitude: "",
        longitude: ""
    });
    const [coordsLoaded, setCoordsLoaded] = useState(false);
    const [geocodeResponse, setGeocodeResponse] = useState("");
    const [formValues, setFormValues] = useState({
        manual_latitude: "",
        manual_longitude: ""
    });

    const [latitudeError, setLatitudeError] = useState({
        display: false,
        message: ""
    });

    const [longitudeError, setLongitudeError] = useState({
        display: false,
        message: ""
    });

    const [distanceToNorthPole, setDistanceToNorthPole] = useState(-1);
    const [distanceToMoon, setDistanceToMoon] = useState(-1);


    const handleChange = (event) => {
        setFormValues({
            ...formValues,
            [event.target.name]: event.target.value,
        });
    };

    function getGeocodeApiURL(lat, lon) {
        return `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}`
    }

    function getDistanceBetweenTwoPoints(cord1, cord2) {

        if (cord1.lat == cord2.lat && cord1.lon == cord2.lon) {
            return 0;
        }

        const radlat1 = (Math.PI * cord1.lat) / 180;
        const radlat2 = (Math.PI * cord2.lat) / 180;

        const theta = cord1.lon - cord2.lon;
        const radtheta = (Math.PI * theta) / 180;

        let dist =
            Math.sin(radlat1) * Math.sin(radlat2) +
            Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

        if (dist > 1) {
            dist = 1;
        }

        dist = Math.acos(dist);
        dist = (dist * 180) / Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344; //convert miles to km

        console.log(dist)
        return dist;
    }

    useEffect(() => {

        navigator.geolocation.getCurrentPosition((position) => {

            setAutoLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            })

            setCoordsLoaded(true)
        })

    }, []);


    useEffect(() => {
        setDistanceToNorthPole(Math.round(getDistanceBetweenTwoPoints({
            lat: autoLocation.latitude,
            lon: autoLocation.longitude
        }, {
            lat: 90,
            lon: 135
        })))

        setDistanceToMoon(Math.round(SunCalc.getMoonPosition(new Date(), autoLocation.latitude, autoLocation.longitude).distance))

    }, [coordsLoaded])


    useEffect(() => {

        if (formValues.manual_latitude.length > 0 && formValues.manual_longitude.length > 0) {
            // latitude should be between -90 and 90
            if (Math.abs(formValues.manual_latitude) > 90) {
                setLatitudeError({
                    display: true,
                    message: "Should be between -90 and 90"
                })
            } else {
                setLatitudeError({
                    display: false,
                    message: ""
                })
            }

            if (Math.abs(formValues.manual_longitude) > 180) {
                setLongitudeError({
                    display: true,
                    message: "Should be between -180 and 180"
                })
            } else {
                setLongitudeError({
                    display: false,
                    message: ""
                })
            }

            axios.get(getGeocodeApiURL(formValues.manual_latitude, formValues.manual_longitude))
                .then((response) => {
                    setGeocodeResponse(response.data)
                })
        }

    }, [formValues])


    return (
        <Container maxWidth={"lg"} style={{
            display: "flex",
            height: "100vh",
            justifyContent: "center",
            alignItems: "center"
        }}>
            <Box className={"background"}>
                <Grid container
                      style={{
                          display: "flex",
                          alignItems: "stretch",
                          justifyContent: "stretch"
                      }}
                      columns={12}
                >
                    <Grid item xs={12} md={12} lg={12} sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <p className={"heroText"}>
                            Geolocation App
                        </p>
                    </Grid>

                    <Grid item xs={12} sm={12} md={8} sx={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                    }}>
                        <Box className={"latLonContainer"}>
                            <p className={"titleText"}>Manual Coordinates</p>
                            <form>
                                <FormControl style={{
                                    display: "flex",
                                    flex: 1,
                                    alignItems: "center",
                                }}>
                                    <FormGroup row style={{
                                        flex: 1,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginTop: "0px"
                                    }}>
                                        <TextField
                                            id={"manual_latitude"}
                                            name={"manual_latitude"}
                                            margin={"normal"}
                                            variant={"outlined"}
                                            size={"small"}
                                            inputProps={{ "data-testid": "latitude-input" }}
                                            label={"Latitude"}
                                            error={latitudeError.display}
                                            helperText={latitudeError.message}
                                            onChange={handleChange}
                                            style={{
                                                margin: "5px 10px"
                                            }}
                                            type={"number"}
                                        />
                                        <TextField
                                            id={"manual_longitude"}
                                            name={"manual_longitude"}
                                            margin={"normal"}
                                            variant={"outlined"}
                                            size={"small"}
                                            inputProps={{ "data-testid": "longitude-input" }}
                                            label={"Longitude"}
                                            error={longitudeError.display}
                                            helperText={longitudeError.message}
                                            onChange={handleChange}
                                            style={{
                                                margin: "5px 10px"
                                            }}
                                            type={"number"}
                                        />
                                    </FormGroup>

                                </FormControl>
                            </form>
                        </Box>

                    </Grid>

                    <Grid item xs={12} md={4} sx={{
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <Box className={"latLonContainer"}>
                            <p className={"titleText"}>Country</p>
                            {
                                geocodeResponse.length === 0 ?
                                    <p className={"coordText"}>Waiting for input</p>
                                    :
                                    <p data-testiqd={"country-locality-p"} className={"coordText"}>{geocodeResponse.countryName ? geocodeResponse.countryName : geocodeResponse.locality }</p>
                            }
                        </Box>
                    </Grid>

                    <Grid item xs={6} md={3} sx={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                    }}>
                        <Box className={"latLonContainer"}>
                            <p className={"titleText"}>Auto Latitude</p>
                            {
                                !coordsLoaded ? <CircularProgress size={35} style={{marginBottom: "10px"}}/> :
                                    <p className={"coordText"} data-testid={"auto-latitude"}>{autoLocation.latitude}</p>
                            }
                        </Box>

                    </Grid>

                    <Grid item xs={6} md={3} sx={{
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <Box className={"latLonContainer"}>
                            <p className={"titleText"}>Auto Longitude</p>
                            {
                                !coordsLoaded ? <CircularProgress size={35} style={{marginBottom: "10px"}}/> :
                                    <p className={"coordText"} data-testid={"auto-longitude"}>{autoLocation.longitude}</p>
                            }
                        </Box>
                    </Grid>

                    <Grid item xs={6} md={6} sx={{
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <Box className={"latLonContainer"}>
                            <p className={"titleText"}>Distance to the North Pole</p>
                            {
                                !coordsLoaded ? <CircularProgress size={35} style={{marginBottom: "10px"}}/> :
                                    <p className={"coordText"}>{distanceToNorthPole} km</p>
                            }
                        </Box>
                    </Grid>

                    <Grid item xs={6} md={6} sx={{
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <Box className={"latLonContainer"}>
                            <p className={"titleText"}>Distance to the Moon</p>
                            {
                                !coordsLoaded ? <CircularProgress size={35} style={{marginBottom: "10px"}}/> :
                                    <p className={"coordText"}>{distanceToMoon} km</p>
                            }
                        </Box>
                    </Grid>


                </Grid>
            </Box>
        </Container>
    );
}

export default App;
