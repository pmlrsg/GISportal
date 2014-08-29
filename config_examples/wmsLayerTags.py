#!/usr/bin/env python

layers = {
    "DMI": {
        "": {
            "Confidence": "High", 
            "interval": "seasonal", 
            "niceName": "Temperature"
        }
    }, 
    "cefas": {
        "Cod__adult_": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Fish", 
            "MSFD": [
                "Foodwebs", 
                "Fisheries"
            ], 
            "interval": "daily", 
            "niceName": "Adult Cod", 
            "region": "N. Atlantic"
        }, 
        "Herbivorous_and_Omnivorous_zooplankton__copepods_": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Zooplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "daily", 
            "niceName": "Zooplankton", 
            "region": "N. Atlantic"
        }, 
        "Herring__adult_": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Fish", 
            "MSFD": [
                "Foodwebs", 
                "Fisheries"
            ], 
            "interval": "daily", 
            "niceName": "Adult herring", 
            "region": "N. Atlantic"
        }, 
        "Herring__juvenile_0__1_": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Fish", 
            "MSFD": [
                "Foodwebs", 
                "Fisheries"
            ], 
            "interval": "daily", 
            "niceName": "Juvenile herring", 
            "region": "N. Atlantic"
        }, 
        "Juvenile_Cod_0_2__0_40cm_": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Fish", 
            "MSFD": [
                "Foodwebs", 
                "Fisheries"
            ], 
            "interval": "daily", 
            "niceName": "Juvenile cod", 
            "region": "N. Atlantic"
        }, 
        "Phytoplankton": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "daily", 
            "niceName": "Phytoplankton biomass", 
            "region": "N. Atlantic"
        }, 
        "Plaice": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Fish", 
            "MSFD": [
                "Foodwebs", 
                "Fisheries"
            ], 
            "interval": "daily", 
            "niceName": "Plaice", 
            "region": "N. Atlantic"
        }, 
        "Sandeels": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Fish", 
            "MSFD": [
                "Foodwebs", 
                "Fisheries"
            ], 
            "interval": "daily", 
            "niceName": "Sandeels", 
            "region": "N. Atlantic"
        }, 
        "Seabirds": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Fish", 
            "MSFD": [
                "Foodwebs", 
                "Fisheries"
            ], 
            "interval": "daily", 
            "niceName": "Seabirds", 
            "region": "N. Atlantic"
        }
    }, 
    "dmi_annual": {
        "Chl_a": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Chlorophyll a", 
            "region": "Baltic"
        }, 
        "DIN": {
            "Confidence": "High", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "annual", 
            "niceName": "Nitrate", 
            "region": "Baltic"
        }, 
        "DIP": {
            "Confidence": "High", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "annual", 
            "niceName": "Phosphate", 
            "region": "Baltic"
        }, 
        "Oxy": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Gases", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "annual", 
            "niceName": "Oxygen", 
            "region": "Baltic"
        }
    }, 
    "dmi_monthly": {
        "DIN": {
            "Confidence": "High", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "Nitrate", 
            "region": "Baltic"
        }, 
        "DIP": {
            "Confidence": "High", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "Phosphate", 
            "region": "Baltic"
        }, 
        "Dia_Chl": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Diatom biomass", 
            "region": "Baltic"
        }, 
        "Fla_Chl": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Flagellate biomass", 
            "region": "Baltic"
        }, 
        "MicroZoo": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Zooplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Microzooplankton", 
            "region": "Baltic"
        }, 
        "Oxy": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Gases", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "Oxygen", 
            "region": "Baltic"
        }, 
        "Pco2": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Gases", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "pC02", 
            "region": "Baltic"
        }, 
        "Temp": {
            "Confidence": "High", 
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Temperature", 
            "region": "Baltic"
        }
    }, 
    "dmi_seasonal": {
        "Salt": {
            "Confidence": "High", 
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "seasonal", 
            "niceName": "Salinity", 
            "region": "Baltic"
        }
    }, 
    "hcmr": {
        "Oxygen": {
            "Ecosystem_Element": "Gases", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "Oxygen", 
            "region": "Med"
        }, 
        "chl": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Chlorophyll a", 
            "region": "Med"
        }, 
        "netPP": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Net Primary Production", 
            "region": "Med"
        }, 
        "nitrate": {
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity"
            ], 
            "interval": "monthly", 
            "niceName": "Nitrate", 
            "region": "Med"
        }, 
        "phosphate": {
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity"
            ], 
            "interval": "monthly", 
            "niceName": "Phosphate", 
            "region": "Med"
        }, 
        "salinity": {
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Salinity", 
            "region": "Med"
        }, 
        "temperature": {
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Temperature", 
            "region": "Med"
        }
    }, 
    "imsmetu_annual": {
        "PBD": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Phytoplankton growing season", 
            "region": "Black Sea"
        }, 
        "PMB": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Maximum phytoplankton", 
            "region": "Black Sea"
        }, 
        "PMBT": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Peak phytoplankton day", 
            "region": "Black Sea"
        }
    }, 
    "ogs_Ammonia": {
        "Ammonia": {
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "Ammonia", 
            "region": "Med"
        }
    }, 
    "ogs_C-Diat": {
        "C-Diat": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Diatom biomass", 
            "region": "Med"
        }
    }, 
    "ogs_C-LargePhy": {
        "C-LargePhy": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Micro phytoplankton", 
            "region": "Med"
        }
    }, 
    "ogs_C-Nflag": {
        "C-Nflag": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Nano phytoplankton", 
            "region": "Med"
        }
    }, 
    "ogs_C-PicoPhy": {
        "C-PicoPhy": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Pico phytoplankton", 
            "region": "Med"
        }
    }, 
    "ogs_CarnZoo": {
        "CarnZoo": {
            "Ecosystem_Element": "Zooplankton", 
            "MSFD": [
                "Biodiversity", 
                "Foodwebs", 
                "Fisheries"
            ], 
            "interval": "annual", 
            "niceName": "Mezozooplankton", 
            "region": "Med"
        }
    }, 
    "ogs_Chl-Diat": {
        "Chl-Diat": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Diatom chlorophyll a", 
            "region": "Med"
        }
    }, 
    "ogs_Chl-LargePhy": {
        "Chl-LargePhy": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Microphytoplankton chlorophyll a", 
            "region": "Med"
        }
    }, 
    "ogs_Chl-Nflag": {
        "Chl-Nflag": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Nanoflagellates chlorophyll a", 
            "region": "Med"
        }
    }, 
    "ogs_Chl-PicoPhy": {
        "Chl-PicoPhy": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Picophytoplankton chlorophyll a", 
            "region": "Med"
        }
    }, 
    "ogs_HeteroFlag": {
        "HeteroFlag": {
            "Ecosystem_Element": "Zooplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Heterotrophic flagellates biomass", 
            "region": "Med"
        }
    }, 
    "ogs_MicroZoo": {
        "MicroZoo": {
            "Ecosystem_Element": "Zooplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Microzooplankton", 
            "region": "Med"
        }
    }, 
    "ogs_NPP": {
        "NPP": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Net Primary Production", 
            "region": "Med"
        }
    }, 
    "ogs_OmniZoo": {
        "OmniZoo": {
            "Ecosystem_Element": "Zooplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Zooplankton", 
            "region": "Med"
        }
    }, 
    "ogs_R_NO3_PHOS": {
        "R_NO3_PHOS": {
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity"
            ], 
            "interval": "monthly", 
            "niceName": "nitrate/phosphate ratio", 
            "region": "Med"
        }
    }, 
    "ogs_R_NO3_SIO4": {
        "R_NO3_SIO4": {
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity"
            ], 
            "interval": "monthly", 
            "niceName": "nitrate/silicate ratio", 
            "region": "Med"
        }
    }, 
    "ogs_Totchl": {
        "Totchl": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Chlorophyll a", 
            "region": "Med"
        }
    }, 
    "ogs_TotphytoC": {
        "TotphytoC": {
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Phytoplankton biomass", 
            "region": "Med"
        }
    }, 
    "ogs_Totzoo": {
        "Totzoo": {
            "Ecosystem_Element": "Zooplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Zooplankton biomass", 
            "region": "Med"
        }
    }, 
    "ogs_Wmin_NO3": {
        "Wmin_NO3": {
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity"
            ], 
            "interval": "annual", 
            "niceName": "Winter Nitrate", 
            "region": "Med"
        }
    }, 
    "ogs_Wmin_PO4": {
        "Wmin_PO4": {
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity"
            ], 
            "interval": "annual", 
            "niceName": "Winter phosphate", 
            "region": "Med"
        }
    }, 
    "ogs_Wmin_SiO2": {
        "Wmin_SiO2": {
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity"
            ], 
            "interval": "annual", 
            "niceName": "Winter Silicate", 
            "region": "Med"
        }
    }, 
    "ogs_Oxygen": {
        "Oxygen": {
            "Ecosystem_Element": "Gases", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "Oxygen", 
            "region": "Med"
        }
    }, 
    "ogs_pCO2": {
        "pCO2": {
            "Ecosystem_Element": "Gases", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "pC02", 
            "region": "Med"
        }
    }, 
    "ogs_sal": {
        "sal": {
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Salinity", 
            "region": "Med"
        }
    }, 
    "ogs_tem": {
        "tem": {
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "annual", 
            "niceName": "Temperature anomaly", 
            "region": "Med"
        }
    }, 
    "ogs_temp": {
        "temp": {
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Temperature", 
            "region": "Med"
        }
    }, 
    "pml_annual": {
        "DIN_winter-min": {
            "Confidence": "High", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "annual", 
            "niceName": "Winter Nitrate", 
            "region": "N. Atlantic"
        }, 
        "DIP_winter-min": {
            "Confidence": "High", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "annual", 
            "niceName": "Winter phosphate", 
            "region": "N. Atlantic"
        }, 
        "DISi_winter-min": {
            "Confidence": "High", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "annual", 
            "niceName": "Winter Silicate", 
            "region": "N. Atlantic"
        }, 
        "bloom_duration": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Phytoplankton growing season", 
            "region": "N. Atlantic"
        }, 
        "bloom_max": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Maximum phytoplankton", 
            "region": "N. Atlantic"
        }, 
        "max_Chl_surf": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Max. surface chlorophyll", 
            "region": "N. Atlantic"
        }, 
        "max_Chl_total": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "annual", 
            "niceName": "Total chlorophyll in water column", 
            "region": "N. Atlantic"
        }, 
        "minO2": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Gases", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "annual", 
            "niceName": "Minimum oxygen", 
            "region": "N. Atlantic"
        }
    }, 
    "pml_daily": {
        "DP1c": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "daily", 
            "niceName": "Mean daily diatom biomass", 
            "region": "N. Atlantic"
        }, 
        "DP2c": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "daily", 
            "niceName": "Mean daily flagellates biomass", 
            "region": "N. Atlantic"
        }, 
        "DP3c": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "daily", 
            "niceName": "Mean daily picophytoplankton biomass", 
            "region": "N. Atlantic"
        }, 
        "DP4c": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "daily", 
            "niceName": "Mean daily Microphytoplankton biomass", 
            "region": "N. Atlantic"
        }
    }, 
    "pml_monthly": {
        "Chl1": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Diatom chlorophyll a (N.Atlantic)", 
            "region": "N. Atlantic"
        }, 
        "Chl2": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Nanoflagellates chlorophyll a", 
            "region": "N. Atlantic"
        }, 
        "Chl3": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Picophytoplankton chlorophyll a", 
            "region": "N. Atlantic"
        }, 
        "Chl4": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Microphytoplankton chlorophyll a", 
            "region": "N. Atlantic"
        }, 
        "DIN": {
            "Confidence": "High", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "Nitrate", 
            "region": "N. Atlantic"
        }, 
        "DIP": {
            "Confidence": "High", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "Phosphate", 
            "region": "N. Atlantic"
        }, 
        "DISi": {
            "Confidence": "High", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "Silicate", 
            "region": "N. Atlantic"
        }, 
        "MLD": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Mixed layer depth", 
            "region": "N. Atlantic"
        }, 
        "N:P": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity"
            ], 
            "interval": "monthly", 
            "niceName": "nitrate/phosphate ratio", 
            "region": "N. Atlantic"
        }, 
        "N:Si": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Nutrient", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity"
            ], 
            "interval": "monthly", 
            "niceName": "nitrate/silicate ratio", 
            "region": "N. Atlantic"
        }, 
        "O2": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Gases", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "Oxygen", 
            "region": "N. Atlantic"
        }, 
        "PEA": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Potential energy anomaly", 
            "region": "N. Atlantic"
        }, 
        "S": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Salinity", 
            "region": "N. Atlantic"
        }, 
        "T": {
            "Confidence": "High", 
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Temperature", 
            "region": "N. Atlantic"
        }, 
        "Z4c": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Zooplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Mesozooplankton biomass", 
            "region": "N. Atlantic"
        }, 
        "Z5c": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Zooplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Microzooplankton biomass", 
            "region": "N. Atlantic"
        }, 
        "Z6c": {
            "Confidence": "Low", 
            "Ecosystem_Element": "Zooplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Heterotrophic flagellates biomass", 
            "region": "N. Atlantic"
        }, 
        "euphDepth": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Euphotic depth", 
            "region": "N. Atlantic"
        }, 
        "netPP": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Phytoplankton", 
            "MSFD": [
                "Eutrophication", 
                "Biodiversity", 
                "Foodwebs"
            ], 
            "interval": "monthly", 
            "niceName": "Net Primary Production", 
            "region": "N. Atlantic"
        }, 
        "pCO2": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Gases", 
            "MSFD": [
                "Eutrophication"
            ], 
            "interval": "monthly", 
            "niceName": "pC02", 
            "region": "N. Atlantic"
        }, 
        "water_depth": {
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Hydrography"
            ], 
            "interval": "monthly", 
            "niceName": "Depth of water column", 
            "region": "N. Atlantic"
        }
    }, 
    "pml_seasonal": {
        "S_anom": {
            "Confidence": "Medium", 
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "seasonal", 
            "niceName": "Salinity anomaly", 
            "region": "N. Atlantic"
        }, 
        "T_anom": {
            "Confidence": "High", 
            "Ecosystem_Element": "Physics", 
            "MSFD": [
                "Biodiversity", 
                "Hydrography"
            ], 
            "interval": "seasonal", 
            "niceName": "Temperature anomaly", 
            "region": "N. Atlantic"
        }
    }
}
