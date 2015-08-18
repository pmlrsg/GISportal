layers = [
   {
      "name": "cci",
      "options": {
         "providerShortTag": "CCI",
         "wcs": False
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/CCI-v1.0-D?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/CCI-v1.0-D?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {}
   },
   {
      "name": "hcmr",
      "options": {
         "positive": "down",
         "providerShortTag": "HCMR",
         "wcs" : True
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/HCMR-M-AGGSLOW?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/HCMR-M-AGGSLOW?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "pml_annual",
      "options": {
         "providerShortTag": "PML"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/PML-Y-AGGSLOW?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/PML-Y-AGGSLOW?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "pml_seasonal",
      "options": {
         "providerShortTag": "PML"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/PML-S-AGGSLOW?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/PML-S-AGGSLOW?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
   },
   {
      "name": "pml_monthly",
      "options": {
         "providerShortTag": "PML"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/PML-M-AGGSLOW?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/PML-M-AGGSLOW?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "pml_daily",
      "options": {
         "providerShortTag": "PML"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/PML-D-AGGSLOW?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/PML-D-AGGSLOW?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "imsmetu_annual",
      "options": {
         "positive": "down",
         "providerShortTag": "IMS-METU"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/IMSMETU-Y/BIMS0.1_HC_IMSMETU_blacksea_19900101-20090101_ANNUAL.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/IMSMETU-Y/BIMS0.1_HC_IMSMETU_blacksea_19900101-20090101_ANNUAL.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "cefas",
      "options": {
         "providerShortTag": "Cefas"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/CEFAS/resoutcut.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/CEFAS/resoutcut.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "dmi_monthly",
      "options": {
         "providerShortTag": "DMI"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/DMI_M/DMI_1990_2009_monthly_mean.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/DMI_M/DMI_1990_2009_monthly_mean.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "dmi_annual",
      "options": {
         "providerShortTag": "DMI"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/DMI_Y/DMI_1990_2009_annual_mean.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/DMI_Y/DMI_1990_2009_annual_mean.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "dmi_seasonal",
      "options": {
         "providerShortTag": "DMI"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/DMI_S/DMI_1990_2009_seasonal_anomaly.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/DMI_S/DMI_1990_2009_seasonal_anomaly.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Ammonia",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_ammonia.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_ammonia.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
         "Ammonia": {
            "Ecosystem_Element": "Nutrient",
            "MSFD": [
               "Eutrophication"
            ],
            "interval": "monthly",
            "niceName": "Ammonia",
            "region": "Med"
         }
      }
   },
   {
      "name": "ogs_CarnZoo",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_CarnMesozoo.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_CarnMesozoo.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_C-Diat",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cdia.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cdia.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Chl-Diat",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-dia.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-dia.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Chl-LargePhy",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-largephy.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-largephy.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Chl-Nflag",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-nflag.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-nflag.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Chl-PicoPhy",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-picophy.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_chl-picophy.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_C-LargePhy",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Clargephy.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Clargephy.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_C-Nflag",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cnflag.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cnflag.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_C-PicoPhy",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cpicophy.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Cpicophy.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_HeteroFlag",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_HeteroFlag.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_HeteroFlag.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_MicroZoo",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Microzoo.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Microzoo.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Nitrate",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_nitrate.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_nitrate.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {}
   },
   {
      "name": "ogs_OmniZoo",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_OmniMesozoo.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_OmniMesozoo.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Oxygen",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_oxygen.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_oxygen.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
         "Oxygen": {
            "Ecosystem_Element": "Gases",
            "MSFD": [
               "Eutrophication"
            ],
            "interval": "monthly",
            "niceName": "Oxygen",
            "region": "Med"
         }
      }
   },
   {
      "name": "ogs_pCO2",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_pCO.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_pCO.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
         "pCO2": {
            "Ecosystem_Element": "Gases",
            "MSFD": [
               "Eutrophication"
            ],
            "interval": "monthly",
            "niceName": "pC02",
            "region": "Med"
         }
      }
   },
   {
      "name": "ogs_Phosphate",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_phosphate.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_phosphate.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {}
   },
   {
      "name": "ogs_NPP",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_ppn.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_ppn.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_R_NO3NH4_PO4",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3NH4_PO4.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3NH4_PO4.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {}
   },
   {
      "name": "ogs_R_NO3_PHOS",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3_PO4.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3_PO4.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_R_NO3_SIO4",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3_SIO4.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_R_NO3_SIO4.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_sal",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_sal.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_sal.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Silicate",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_silicate.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_silicate.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {}
   },
   {
      "name": "ogs_tem",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_tem_Anomaly.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_tem_Anomaly.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_temp",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_temp.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_temp.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Totchl",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Totalchlorophyll.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Totalchlorophyll.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_TotphytoC",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_TotalPhytoC.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_TotalPhytoC.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Totzoo",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Totalzooplankton.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Totalzooplankton.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Wmin_NO3",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_nitrate.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_nitrate.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Wmin_PO4",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_phosphate.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_phosphate.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   },
   {
      "name": "ogs_Wmin_SiO2",
      "options": {
         "positive": "down",
         "providerShortTag": "OGS"
      },
      "services": {
         "wms": {
            "url": "http://vortices.npm.ac.uk/thredds/wms/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_silicate.nc?",
            "params": {
               "GetCapabilities": {
                  "SERVICE": "WMS",
                  "request": "GetCapabilities",
                  "version": "1.3.0"
               }
            }
         },
         "wcs": {
            "url": "http://vortices.npm.ac.uk/thredds/wcs/OGS/OPATMBFM3_OGS_HC_Med_19990101_20111231_Wmin_silicate.nc?",
            "params": {
               "DescribeCoverage": {
                  "SERVICE": "WCS",
                  "request": "describeCoverage",
                  "version": "1.0.0"
               }
            }
         }
      },
      "indicators": {
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
      }
   }
]