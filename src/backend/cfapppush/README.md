**Note:** Plugin contains non-Glide managed dependencies
                                                   
The CF CLI code is checked in as a non-Glide managed dependency. The CF CLI repository is of significant size (200+ MB) and it would significantly slow down deployment time if Glide dependencies had to be downloaded every time the UI is built.
                                                    