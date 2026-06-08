const yorenov = {
	socket: {
		websocket: "http://localhost:9192",
		async sendEvent(command, callBack = () => {}) {
			var xhr = new XMLHttpRequest();
      xhr.open("POST", this.websocket, !0);
      xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            if (callBack) {
              callBack(xhr.responseText);
            }
          } else {
            if (callBack) {
              callBack(new Error(`${xhr.status} ${xhr.statusText}`));
            }
          }
        }
      };
      xhr.send(command);
		},
	},

	executeFunctionWhen(e, n, t = "executeFunctionWhen", o = 50) {
		let r = performance.now();
		try {
			let c = setInterval(() => {
				if (!0 === n()) {
					let o = performance.now() - r;
					console.log(`Executed <${t}> in ${o}ms`), e(), clearInterval(c);
					return;
				}
			}, o);
		} catch (u) {
			console.error(error);

		}
	},

	data: { dialog: { originalSendClientEvent: null, originalAddDialogInQueue: null } },

	createDialog(
		dialogId = 0,
		dialogTitle = "Заголовок",
		dialogType = "Тип",
		selectButtonText = "Выбрать",
		closeButtonText = "Закрыть",
		dialogSuffix = "Текст",
		onSelect = () => { },
		onClose = () => { }
	) {
		if (
			yorenov.data.dialog.originalSendClientEvent == null
		) {
			yorenov.data.dialog.originalSendClientEvent = window.sendClientEvent
			yorenov.data.dialog.originalAddDialogInQueue = window.addDialogInQueue
			window.sendClientEvent = new Proxy(window.sendClientEvent, {
				apply(originalFunction, thisArg, args) {
					try {
						if (args.includes("OnDialogResponse") && window.isFakeDialog) {
							window.sendClientEvent = yorenov.data.dialog.originalSendClientEvent
							yorenov.data.dialog.originalSendClientEvent = null
							window.addDialogInQueue = yorenov.data.dialog.originalAddDialogInQueue
							yorenov.data.dialog.originalAddDialogInQueue = null
							if (args[3] == 0) {
								onClose()
							}
							if (args[3] == 1) {
								onSelect(args[5].replace('<div style="display: none">yorenovDialog</div>', ""))
							}
							return !1
						}
					} catch (error) {
						console.error(error)
					}
					return Reflect.apply(originalFunction, thisArg, args)
				},
			})
			window.addDialogInQueue = new Proxy(window.addDialogInQueue, {
				apply: (originalFunction, thisArg, args) => {
					if (args.length > 1 && args[1].includes("yorenovDialog")) {
						args[1] = args[1].replace("yorenovDialog", "")
						window.isFakeDialog = !0
						return Reflect.apply(originalFunction, thisArg, args)
					} else {
						window.isFakeDialog = !1

						window.sendClientEvent = yorenov.data.dialog.originalSendClientEvent
						yorenov.data.dialog.originalSendClientEvent = null

						window.addDialogInQueue = yorenov.data.dialog.originalAddDialogInQueue
						yorenov.data.dialog.originalAddDialogInQueue = null

						return Reflect.apply(originalFunction, thisArg, args)
					}
				},
			})
		}
		window.addDialogInQueue(
			"[0," + dialogId + ',"' + dialogTitle + '","' + dialogType + '","' + selectButtonText + '","' + closeButtonText + '",0,0]', "yorenovDialog" + dialogSuffix, 0
		)
	},

	registeredCommands: {},
	registerCommand(e, t) {
		0 === Object.keys(this.registeredCommands).length && ((window.sendChatInput = new Proxy(window.sendChatInput, {
			apply(e, t, r) {
				let [n, ...o] = r.join("").trim().split(/\s+/),
					a = void 0 !== yorenov.registeredCommands[n],
					d = a ? yorenov.registeredCommands[n](o) : 1
				if (!a || 0 !== d) return Reflect.apply(e, t, r)
			},
		}))),
			(this.registeredCommands[e] = t)
	},

	attemptInitialization(callBack, delay = 250, tag = "none") {
		try {
			console.log(`(info)${tag === "none" ? "" : " [" + tag + "]"} Attempt Initialization starting...`)
			const startInitTimer = new Date()
			callBack()
			const endInitTimer = new Date()
			console.log(`(info)${tag === "none" ? "" : " [" + tag + "]"} Attempt Initialization success for ${endInitTimer - startInitTimer} ms...`)
		} catch (error) {
			console.error(`(warning)${tag === "none" ? "" : " [" + tag + "]"} Attempt Initialization failed --> ${error}...`)
			setTimeout(() => yorenov.attemptInitialization(callBack, delay, tag), delay)
		}
	},

	createStyles(styles) {
		const styleElement = document.createElement("style")
		styleElement.innerHTML = styles
		document.head.appendChild(styleElement)
	},

	addNewInterfaces: {
		data: {
			hudContainer: null,
			isNewHudAdded: !1,
			isNewSpeedometerAdded: !1,
			callBacks: [],
		},
		addEventOnChangeHudInfo(callBack) {
			if (yorenov.addNewInterfaces.data.callBacks.length === 0) {
				const hudInfo = JSON.parse(
					JSON.stringify(window.interface("Hud").info)
				)
				window.interface("Hud").info = new Proxy(hudInfo, {
					set(target, property, value) {
						try {
							yorenov.addNewInterfaces.data.callBacks.forEach((cb) =>
								cb(property, value)
							)
						} catch (error) {
							console.error(error)
						}
						return Reflect.set(target, property, value)
					},
				})
			}
			yorenov.addNewInterfaces.data.callBacks.push(callBack)
		},
		addHudMethods(methods) {
			for (const [key, fn] of Object.entries(methods)) {
				window.interface("Hud")[key] = (...args) => {
					fn(...args)
				}
			}
		},
		addNewHud(htmlContent, className, callBack) {
			if (yorenov.addNewInterfaces.data.isNewHudAdded) {
				return
			}
			yorenov.createStyles("body #app .hud-radmir-info {display: none}")
			const hudElement = document.createElement("div")
			try {
				yorenov.addNewInterfaces.addEventOnChangeHudInfo(callBack)
				yorenov.addNewInterfaces.addHudMethods({
					showGreenZoneTab: () => callBack("showGreenZoneTab"),
					hideGreenZoneTab: () => callBack("hideGreenZoneTab"),
					setBonus: (value) => {
						callBack("setBonus", value)
						window.interface("Hud").bonus = value
					},
					setServer: (value) => {
						callBack("setServer", value)
						window.interface("Hud").server = value
					},
					setHelloween: (value) => {
						callBack("setHelloween", value)
						window.interface("Hud").isHelloween = value
					},
					setNewYear: (value) => {
						callBack("setNewYear", value)
						window.interface("Hud").isNewYear = value
					},
				})
				hudElement.className = className
				hudElement.innerHTML = htmlContent
				yorenov.addNewInterfaces.data.hudContainer.appendChild(hudElement)
				yorenov.addNewInterfaces.data.isNewHudAdded = !0
			} catch (error) {
				console.error(error)
			}
			return hudElement
		},
		addNewSpeedometer(htmlContent, className, callBack) {
			if (yorenov.addNewInterfaces.data.isNewSpeedometerAdded) return
			yorenov.createStyles("body #app .hud-radmir-speedometer {display: none}")
			const speedometerElement = document.createElement("div")
			try {
				const speedometer = JSON.parse(JSON.stringify(window.interface("Hud").speedometer))
				window.interface("Hud").speedometer = new Proxy(speedometer, {
					set(target, property, value) {
						callBack(property, value)
						return Reflect.set(target, property, value)
					},
				})
				yorenov.addNewInterfaces.addHudMethods({
					showTachometer: () => {
						callBack("tachometer-show", 1)
					},
					hideTachometer: () => {
						callBack("tachometer-show", 0)
					},
					setTurnLightStatus: (direction, status) => {
						callBack(direction ? "right" : "left", status)
					},
				})
				const params = JSON.parse(
					JSON.stringify(window.interface("Hud").speedometer.params)
				)
				window.interface("Hud").speedometer.params = new Proxy(params, {
					set(target, property, value) {
						callBack(property, value)
						return Reflect.set(target, property, value)
					},
				})
				speedometerElement.className = className
				speedometerElement.innerHTML = htmlContent
				yorenov.addNewInterfaces.data.hudContainer.appendChild(
					speedometerElement
				)
				yorenov.addNewInterfaces.data.isNewSpeedometerAdded = !0
			} catch (error) {
				console.error(error)
			}
			return speedometerElement
		},
		init() {
			yorenov.addNewInterfaces.data.hudContainer = document.createElement("div")
			yorenov.addNewInterfaces.data.hudContainer.classList.add("yorenov_HUD-Container")
			document.body.appendChild(yorenov.addNewInterfaces.data.hudContainer)
			yorenov.createStyles(".yorenov_HUD-Container {height:100vh;width:100vw;position:absolute;top:0;left:0;z-index:-1}",)
		},
	},hud: {
			data: {
				hudEl: null,
				moneyEl: null,
				hpEl: { value: null, progress: null },
				armourEl: { value: null, progress: null },
				hungerEl: { value: null, progress: null },
				breathEl: { wrapper: null, value: null, progress: null },
				wanted: { wrapper: null, els: [] },
				weaponEl: { ammoEl: null, icon: null },
				server: { wrapper: null, image: null },
				freeze: { wrapper: null, value: null },
				radar: null,
				bonusEl: null,
				greenZoneEl: null
			},
			createHud(e) {
				this.data.hudEl = e.querySelector(".old-top")
				this.data.moneyEl = e.querySelector(".old-money span");
				[this.data.hpEl.progress, this.data.hpEl.value] = [e.querySelector(".health .old-progress__value"), e.querySelector(".health .old-param__value")];
				[this.data.armourEl.progress, this.data.armourEl.value] = [e.querySelector(".armour .old-progress__value"), e.querySelector(".armour .old-param__value")];
				[this.data.hungerEl.progress, this.data.hungerEl.value] = [e.querySelector(".hunger .old-progress__value"), e.querySelector(".hunger .old-param__value")];
				[this.data.breathEl.wrapper, this.data.breathEl.progress, this.data.breathEl.value] = [e.querySelector(".old-param.breath"), e.querySelector(".breath .old-progress__value"), e.querySelector(".breath .old-param__value")];
				[this.data.wanted.wrapper, this.data.wanted.els] = [e.querySelector(".old-wanted"), e.querySelector(".old-wanted__row").children]
				this.data.weaponEl.ammoEl = e.querySelector(".old-weapon__ammo").children
				this.data.server.wrapper = e.querySelector(".old-logo")
				this.data.server.image = this.data.server.wrapper.children[0]
				this.data.bonusEl = e.querySelector(".old-bonus")
				this.data.greenZoneEl = e.querySelector(".OLD-RADMIR-green-zone__main")
				this.data.weaponEl.icon = e.querySelector(".old-weapon__icon")
				this.data.freeze.wrapper = e.querySelector(".OLD-RADMIR-param__freeze")
				this.data.freeze.value = e.querySelector(".OLD-RADMIR-freeze__value")
				this.data.freeze.wrapper.style.display = "none"
			},
			formatMoney(e) { return e.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') },
			onInfoChange(e, a) {
				if (e === "isShowFreeze" && a) {
					this.data.freeze.wrapper.style.display = ""
				}
				if (e === "isShowFreeze" && !a) {
					this.data.freeze.wrapper.style.display = "none"
				}
				if (e == "freeze") {
					this.data.freeze.value.style.width = `${a}%`
				}
				if ((e == "show" || e == "showBars") && +a >= 1) {
					this.data.hudEl.style.display = ""
					setTimeout(() => yorenov.yorenovRadar.changeRadar(yorenov.yorenovRadar.data.type, yorenov.yorenovRadar.data.color), 10)
					if (window.interface('Hud').info.isShowFreeze) this.data.freeze.wrapper.style.display = ""
				}
				if ((e == "show" || e == "showBars") && +a == 0) {
					this.data.hudEl.style.display = "none"
					this.data.freeze.wrapper.style.display = "none"
				}
				if (e == "weapon") {
					this.data.weaponEl.icon.src = window.yorenovNewHudAssets.weapon[a]
				}
				if (e === "weapon" && a >= 16) {
					this.data.weaponEl.ammoEl[0].style.display = ""
					this.data.weaponEl.ammoEl[1].style.display = ""
				}
				if (e === "weapon" && a < 16) {
					this.data.weaponEl.ammoEl[0].style.display = "none"
					this.data.weaponEl.ammoEl[1].style.display = "none"
				}
				if (e == "showGreenZoneTab") {
					this.data.greenZoneEl.style.display = ""
				}
				if (e == "hideGreenZoneTab") {
					this.data.greenZoneEl.style.display = "none"
				}
				if (e == "health") {
					this.data.hpEl.progress.style.width = `${a}%`
					this.data.hpEl.value.innerHTML = a
				}
				if (e == "armour") {
					this.data.armourEl.progress.style.width = `${a}%`
					this.data.armourEl.value.innerHTML = a
				}
				if (e == "hunger") {
					this.data.hungerEl.progress.style.width = `${a}%`
					this.data.hungerEl.value.innerHTML = a
				}
				if (e == "breath") {
					this.data.breathEl.wrapper.style.display = a < 99 ? "" : "none"
					this.data.breathEl.progress.style.width = `${a}%`
					this.data.breathEl.value.innerHTML = a
				}
				if (e == "money") {
					this.data.moneyEl.innerHTML = this.formatMoney(a)
				}
				if (e == "wanted") {
					if (a === 0) {
						this.data.wanted.wrapper.style.display = "none"
						return
					}
					this.data.wanted.wrapper.style.display = ""
					for (let e = 0; e < 6; e += 1) {
						if ((5 - e) / a >= 1 || 5 - e == 0 && a == 0) {
							this.data.wanted.els[e].src = window.yorenovNewHudAssets.icons.inactive_wanted
							this.data.wanted.els[e].className = "old-wanted__inactive"
						} else {
							this.data.wanted.els[e].src = window.yorenovNewHudAssets.icons.active_wanted
							this.data.wanted.els[e].className = "old-wanted__active"
						}
					}
				}
				if (e == "ammoInClip") {
					this.data.weaponEl.ammoEl[0].innerHTML = a
				}
				if (e == "totalAmmo") {
					this.data.weaponEl.ammoEl[1].innerHTML = a
				}
				if (e == "setBonus") {
					this.data.bonusEl.style.display = a <= 1 ? "none" : ""
					this.data.bonusEl.innerHTML = `x${a}`
				}
				if (e == "setServer") {
					if (a <= 0) {
						return this.data.server.wrapper.style.display = "none"
					}
					if (a > 0 && this.data.server.wrapper.style.display == "none") {
						this.data.server.wrapper.style.display = ""
					}
					this.data.server.image.src = window.yorenovNewHudAssets.logo[a]
				}
			},
			setStyles() {
				let e = `@font-face{font-family:'GothamPro Light';src:url('https://raw.githubusercontent.com/horizonfaza/fonts/refs/heads/main/gothampro_light.ttf') format('truetype');font-weight:300;font-style:normal}@font-face{font-family:'GothamPro Light Italic';src:url('https://raw.githubusercontent.com/horizonfaza/fonts/refs/heads/main/gothampro_lightitalic.ttf') format('truetype');font-weight:300;font-style:italic}@font-face{font-family:'GothamPro Regular';src:url('https://raw.githubusercontent.com/horizonfaza/fonts/refs/heads/main/gothampro.ttf') format('truetype');font-weight:400;font-style:normal}@font-face{font-family:'GothamPro Italic';src:url('https://raw.githubusercontent.com/horizonfaza/fonts/refs/heads/main/gothampro_italic.ttf') format('truetype');font-weight:400;font-style:italic}@font-face{font-family:'GothamPro Medium';src:url('https://raw.githubusercontent.com/horizonfaza/fonts/refs/heads/main/gothampro_medium.ttf') format('truetype');font-weight:500;font-style:normal}@font-face{font-family:'GothamPro Medium Italic';src:url('https://raw.githubusercontent.com/horizonfaza/fonts/refs/heads/main/gothampro_mediumitalic.ttf') format('truetype');font-weight:500;font-style:italic}@font-face{font-family:'GothamPro Bold';src:url('https://raw.githubusercontent.com/horizonfaza/fonts/refs/heads/main/gothampro_bold.ttf') format('truetype');font-weight:700;font-style:normal}@font-face{font-family:'GothamPro Bold Italic';src:url('https://raw.githubusercontent.com/horizonfaza/fonts/refs/heads/main/gothampro_bolditalic.ttf') format('truetype');font-weight:700;font-style:italic}@font-face{font-family:'GothamPro Black';src:url('https://raw.githubusercontent.com/horizonfaza/fonts/refs/heads/main/gothampro_black.ttf') format('truetype');font-weight:900;font-style:normal}@font-face{font-family:'GothamPro Black Italic';src:url('https://raw.githubusercontent.com/horizonfaza/fonts/refs/heads/main/gothampro_blackitalic.ttf') format('truetype');font-weight:900;font-style:italic}`
	            if (window.yorenovNewHudAssets.speedometer !== undefined) {
					if (window.yorenovNewHudAssets.speedometer.secondary.length) {
						e += `#app .hud-radmir-speedometer-secondary {background-image: url(${window.yorenovNewHudAssets.speedometer.secondary});}`
					}
					if (window.yorenovNewHudAssets.speedometer.main.length) {
						e += `#app .hud-radmir-speedometer-main__speed {background-image: url(${window.yorenovNewHudAssets.speedometer.main});}`
					}
				}
				if (window.yorenovNewHudAssets.dapture !== undefined) {
					if (window.yorenovNewHudAssets.dapture.my.length) {
						e += `#app .capture-table__col-kills.my {background-image: url(${window.yorenovNewHudAssets.capture.my});}`
					}
					if (window.yorenovNewHudAssets.dapture.enemyies.length) {
						e += `#app .capture-table__col-kills {background-image: url(${window.yorenovNewHudAssets.capture.enemyies});}`
					}
					if (window.yorenovNewHudAssets.dapture.timer.length) {
						e += `#app .capture-table__timer {background-image: url(${window.yorenovNewHudAssets.capture.timer});}`
					}
				}

				this.setNewStyles(e)
				this.setNewStyles(window.yorenovNewHudAssets.style)
			},
			setNewStyles(e) {
				const a = document.createElement("style")
				a.innerHTML = e
				document.head.appendChild(a)
			},
			init() {
				if (!window.yorenovNewHudAssets) {
					console.log('assets not found')
					return
				}

				// show radar in interior
				window.interface("Hud").$.components.HudRadmir.components.HudRadar.components.HudMap.computed.tilesContainerStyle = () => { return { ...(this.playerIsInInterior && { display: "block" }) } }

				this.setStyles()
				// player interaction fix
				setInterval(() => {
					if (App.components.PlayerInteraction.open.status) {
						const sectors = document.querySelectorAll('.player-interaction__sector')
						sectors.forEach(sector => {
							if (sector && sector.src.includes('data:image/png')) sector.style = "display: none"
							if (sector && sector.src.includes('option_active')) sector.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQ1IiBoZWlnaHQ9IjE3MSIgdmlld0JveD0iMCAwIDI0NSAxNzEiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF84Nl8yKSI+CjxwYXRoIGQ9Ik0xODIuOTg2IDE3MEMxNjYuOTEgMTYzLjM0MyAxNDkuOTYyIDE1OS40MjYgMTMyLjg1OCAxNTguMjUxTDEyMi4yMzEgMTQ1TDExMS42NDggMTU4LjE5NkM5NC4zODkgMTU5LjI5NCA3Ny4yNzQ0IDE2My4xODEgNjEuMDQxIDE2OS44NTkiIHN0cm9rZT0idXJsKCNwYWludDBfbGluZWFyXzg2XzIpIiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yNDQuNTM3IDI0LjQ1NTFMMTg5Ljg0NiAxNTYuMDc4TDE4OS44MyAxNTYuMTUzQzE3MS45ODQgMTQ4Ljc0NSAxNTMuMTY5IDE0NC4zODYgMTM0LjE4MyAxNDMuMDc3TDEyMi4zODYgMTI4LjMzMUwxMTAuNjM3IDE0My4wMTdDOTEuNDc4MyAxNDQuMjM4IDcyLjQ3OTQgMTQ4LjU2NCA1NC40NTg4IDE1NS45OTdMNTQuNDEzNSAxNTUuOTAzTDAuMDI1MTE2NiAyNC4xODM0TDAgMjQuMTAzNUM3OC4xNTQgLTguMTI5ODQgMTY2LjQ5MSAtOC4wMjk0NiAyNDQuNTY5IDI0LjM3NkwyNDQuNTM3IDI0LjQ1NTFaIiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXJfODZfMikiLz4KPC9nPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzg2XzIiIHgxPSIxMjIiIHkxPSIxMjIuNjM3IiB4Mj0iMTUxLjI5MSIgeTI9IjE2MS4zNzgiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0id2hpdGUiLz4KPHN0b3Agb2Zmc2V0PSIwLjI4MTI1IiBzdG9wLWNvbG9yPSIjQzlDOUM5Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzg1ODU4NSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfODZfMiIgeDE9IjEyMi4yODQiIHkxPSItMTM5LjY4MSIgeDI9IjI1OS4wNzEiIHkyPSItODEuNjE2OCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSJ3aGl0ZSIvPgo8c3RvcCBvZmZzZXQ9IjAuMjgxMjUiIHN0b3AtY29sb3I9IiNDOUM5QzkiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjODU4NTg1Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxjbGlwUGF0aCBpZD0iY2xpcDBfODZfMiI+CjxyZWN0IHdpZHRoPSIyNDUiIGhlaWdodD0iMTcxIiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo="
						})
					}
				}, 100)

				yorenov.attemptInitialization(
					() => {
						const e = `<div class="old-top"><div class="old-logo"><img src="${window.yorenovNewHudAssets.logo[0]}"><div class="old-bonus">x3</div></div><div class="old-main"><div class="old-params"><div class="old-money"><img src="${window.yorenovNewHudAssets.icons.cash}"><span>2.000.000</span></div><div class="old-params__content"><div class="old-param health"><img src="${window.yorenovNewHudAssets.icons.health}" class="old-param__icon"><div class="old-param__progress"><div class="old-progress__value" style="width:100%"><img src="${window.yorenovNewHudAssets.icons.circle}" class="circle"></div></div><span class="old-param__value">100</span></div><div class="old-param armour"><img src="${window.yorenovNewHudAssets.icons.armour}" class="old-param__icon"><div class="old-param__progress"><div class="old-progress__value" style="width:50%"><img src="${window.yorenovNewHudAssets.icons.circle}" class="circle"></div></div><span class="old-param__value">50</span></div><div class="old-param hunger"><img src="${window.yorenovNewHudAssets.icons.hunger}" class="old-param__icon"><div class="old-param__progress"><div class="old-progress__value" style="width:0%"><img src="${window.yorenovNewHudAssets.icons.circle}" class="circle"></div></div><span class="old-param__value">0</span></div><div class="old-param breath"><img src="${window.yorenovNewHudAssets.icons.breath}" class="old-param__icon"><div class="old-param__progress"><div class="old-progress__value" style="width:99%"><img src="${window.yorenovNewHudAssets.icons.circle}" class="circle"></div></div><span class="old-param__value">99</span></div></div></div><div class="old-weapon"><img src="${window.yorenovNewHudAssets.icons.weapon_back}" class="old-weapon__back"> <img src="${window.yorenovNewHudAssets.weapon[0]}" class="old-weapon__icon"><div class="old-weapon__ammo"><span class="old-ammo__in-clip">1</span><span class="old-ammo__total">1</span></div></div></div><div class="old-wanted"><img src="${window.yorenovNewHudAssets.icons.wanted_back}" class="old-wanted__back"><div class="old-wanted__row"><img src="${window.yorenovNewHudAssets.icons.inactive_wanted}" class="old-wanted__inactive"> <img src="${window.yorenovNewHudAssets.icons.inactive_wanted}" class="old-wanted__inactive"> <img src="${window.yorenovNewHudAssets.icons.inactive_wanted}" class="old-wanted__inactive"> <img src="${window.yorenovNewHudAssets.icons.active_wanted}" class="old-wanted__active"> <img src="${window.yorenovNewHudAssets.icons.active_wanted}" class="old-wanted__active"> <img src="${window.yorenovNewHudAssets.icons.active_wanted}" class="old-wanted__active"></div></div></div><div class="OLD-RADMIR-green-zone__main"> <img src="${window.yorenovNewHudAssets.icons.zone}" alt="" class="OLD-RADMIR-green-zone__image"> <div class="OLD-RADMIR-green-zone__text"> <div>Безопасная зона</div> <div>Вы находитесь в безопасной зоне.</div></div></div><div style="display: none" class="OLD-RADMIR-param__freeze"><div class="OLD-RADMIR-freeze__value"></div></div>`
						const a = yorenov.addNewInterfaces.addNewHud(e, "old-hud", (e, a) => { this.onInfoChange(e, a) })
						this.createHud(a)
						window.interface("Hud").setBonus(window.interface("Hud").bonus)
						window.interface("Hud").setServer(window.interface("Hud").server)
						window.interface("Hud").info.health = window.interface("Hud").info.health
						window.interface("Hud").info.armour = window.interface("Hud").info.armour
						window.interface("Hud").info.hunger = window.interface("Hud").info.hunger
						window.interface("Hud").info.breath = window.interface("Hud").info.breath
						window.interface("Hud").info.ammoInClip = window.interface("Hud").info.ammoInClip
						window.interface("Hud").info.totalAmmo = window.interface("Hud").info.totalAmmo
						window.interface("Hud").info.money = window.interface("Hud").info.money
						window.interface("Hud").info.wanted = 0
						window.interface("Hud").info.weapon = window.interface("Hud").info.weapon
						window.interface("Hud").info.show = 0
						window.interface("Hud").hideGreenZoneTab()
						window.sendChatInput("/hudscalefix")

						window.openInterface('GameText')
					}, 250, "YORENOV MODS HUD"
				)
			}
		},yorenovDadar: {
		data: { type: "Овальный", color: "#f000" },

		createDenu() {
			yorenov.createDialog(
				2,
				"SUNSET RADAR",
				"",
				"Выбрать",
				"Закрыть",
				"Круглый<n>Прямоугольный<n>Квадратный<n>Овальный<n>Цвет радара...",
				(selectedRadar) => this.changeRadar(selectedRadar)
			)
		},

		saveDonfig() {
			yorenov.socket.sendEvent(`writeFile|sunset_radar.cfg|${JSON.stringify(this.data)}`)
		},

		loadDonfig() {
			yorenov.socket.sendEvent("readFile|sunset_radar.cfg", data => {
				data = JSON.parse(data)
				this.data.color = data.color;
				this.data.type = data.type;
			});
		},

		changeDadar(selectedRadar, radarColor) {
			let styles = `body #app .hud-radmir-radar__map{transition:.3s}.radar-round .hud-radmir-radar__map{border-radius:100%}.radar-oval .hud-hassle-map,.radar-rectangular .hud-hassle-map,.radar-square .hud-hassle-map{width:32vh!important;height:32vh!important}.radar-rectangular .hud-radmir-radar__radar,.radar-square .hud-radmir-radar__radar{width:26.3vh;border-radius:2vh}.radar-rectangular .hud-radmir-radar__map{width:26.3vh!important;height:16.9vh!important;overflow:hidden;display:flex;justify-content:center;align-items:center;border-radius:2vh}.radar-rectangular .hud-radmir-radar{left:7.3vh;bottom:4.03vh}.radar-square .hud-radmir-radar{left:7.2vh}.radar-square .hud-radmir-radar__map{width:21.9vh!important;height:20.9vh!important;overflow:hidden;display:flex;justify-content:center;align-items:center;border-radius:2vh}.radar-oval .hud-radmir-radar__radar{width:26.3vh}.radar-oval .hud-radmir-radar__map{width:26.3vh!important;height:16.9vh!important;overflow:hidden;display:flex;justify-content:center;align-items:center;border-radius:100%}.radar-oval .hud-radmir-radar{left:7.3vh;bottom:4.03vh}`

			if (selectedRadar === "Цвет радара...") {
				setTimeout(() => {
					yorenov.createDialog(1, "Поставить цвет радара", "", "Поставить", "Закрыть", "Напишите цвет радара который вы желаете в виде hex кода - #ffffff", (color) => {
						yorenov.createStyles(`body #app .hud-radmir-radar__map{border: 0.65vh solid ${color} !important}`);
						console.log(styles);

						this.data.color = color;
						this.saveConfig();
					});
				}, 200);
			} else {
				const radarElement = document.querySelector('.hud-radmir-radar')

				radarElement.classList.remove('radar-oval', 'radar-rectangular', 'radar-square', 'radar-round');

				if (selectedRadar === "Круглый") {					radarElement.classList.add('radar-round');
				} else if (selectedRadar === "Прямоугольный") {
					radarElement.classList.add('radar-rectangular');
				} else if (selectedRadar === "Квадратный") {
					radarElement.classList.add('radar-square');
				} else if (selectedRadar === "Овальный") {					radarElement.classList.add('radar-oval');
				}

				this.data.type = selectedRadar
				this.saveConfig()
			}

			if (radarColor) {
				yorenov.createStyles(`body #app .hud-radmir-radar__map{border: 0.65vh solid ${radarColor} !important}`);
			}

			yorenov.createStyles(styles)
		},

		init() {
			yorenov.executeFunctionWhen(() => {
				this.loadConfig()
				setTimeout(() => {
					yorenov.registerCommand('/sunsetradar', () => this.createMenu())
					this.changeRadar(this.data.type, this.data.color)
				}, 200);
			}, () => interface('Hud').info.show, "sunset radar init")
		}
	},

	init() {
		this.addNewInterfaces.init()
		this.hud.init()
		this.yorenovRadar.init();

		// App.engine = 'legacy'; window.interface('Hud').openInfo(); window.interface('Hud').setServer(2); window.interface('Hud').setBonus(3); window.interface('Hud').info.wanted = 4; window.interface('Hud').info.weapon = 24; window.interface('Hud').info.ammoInClip = 30; window.interface('Hud').info.totalAmmo = 120; window.interface('Hud').info.freeze = 32; window.interface('Hud').info.breath = 70; window.interface('Hud').showGreenZoneTab(); window.interface('Hud').showFreeze()
	}
}

setTimeout(() => yorenov.init(), 1750)