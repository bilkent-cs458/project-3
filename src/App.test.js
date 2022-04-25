import {render, screen, fireEvent, within, waitFor} from '@testing-library/react';
import App, {getDistanceBetweenTwoPoints} from './App';
import React from "react";
import {SnackbarProvider} from "notistack";

it('renders without crashing', () => {
    render(<SnackbarProvider><App/></SnackbarProvider>);
});

test("renders all components", () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)
    expect(screen.getByText("Manual Coordinates")).toBeInTheDocument()
    expect(screen.getByText("Country")).toBeInTheDocument()
    expect(screen.getByText("Auto Latitude")).toBeInTheDocument()
    expect(screen.getByText("Auto Longitude")).toBeInTheDocument()
    expect(screen.getByText("Distance to the North Pole")).toBeInTheDocument()
    expect(screen.getByText("Distance to the Moon")).toBeInTheDocument()

})

test("an input from the user is waited for before sending out a country identification query", async () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)
    expect(screen.getByText("Waiting for input")).toBeInTheDocument();
})

test("correct country is returned", async () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")

    fireEvent.change(latitudeInput, {target: {value: 10}})
    fireEvent.change(longitudeInput, {target: {value: 20}})

    await waitFor(() => expect(screen.getByText("Chad")).toBeInTheDocument())
})

test("'locality' field from geocoding API is respected when the coordinates do not fall onto a country", async () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")

    fireEvent.change(latitudeInput, {target: {value: 2}})
    fireEvent.change(longitudeInput, {target: {value: 54}})

    await waitFor(() => expect(screen.getByText("Indian Ocean")).toBeInTheDocument())
})

test("automatic location is detected correctly", async () => {
    const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation(success =>
            Promise.resolve(success({
                coords: {
                    latitude: 10.543,
                    longitude: 20.123
                }
            }))
        )
    };

    global.navigator.geolocation = mockGeolocation;

    render(<SnackbarProvider><App/></SnackbarProvider>)

    await waitFor(() => {
        expect(screen.getByText("10.543")).toBeInTheDocument();
        expect(screen.getByText("20.123")).toBeInTheDocument();
    })
})

test("distance to the North Pole is correctly calculated", async () => {
    const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation(success =>
            Promise.resolve(success({
                coords: {
                    latitude: 10.543,
                    longitude: 20.123
                }
            }))
        )
    };

    global.navigator.geolocation = mockGeolocation;

    render(<SnackbarProvider><App /></SnackbarProvider>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")
    const poleDistance = Math.round(getDistanceBetweenTwoPoints({
        lat: 10.543,
        lon: 20.123
    }, {
        lat: 90,
        lon: 135
    }))

    fireEvent.change(latitudeInput, {target: {value: 10}})
    fireEvent.change(longitudeInput, {target: {value: 20}})

    await waitFor(() => {
        expect(screen.getByText(`${poleDistance} km`)).toBeInTheDocument();
    })
})

it("prompts an error when the given latitude and longitude values are out of bounds", async () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")

    fireEvent.change(latitudeInput, {target: {value: 100}})

    await waitFor(() => {
        expect(screen.getByText("Should be between -90 and 90")).toBeInTheDocument();
    })

    fireEvent.change(longitudeInput, {target: {value: 181}})
    await waitFor(() => {
        expect(screen.getByText("Should be between -180 and 180")).toBeInTheDocument();
    })
})


