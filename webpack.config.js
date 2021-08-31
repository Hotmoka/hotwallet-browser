const webpack = require('webpack');
const ejs = require('ejs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const { VueLoaderPlugin } = require('vue-loader');
const { version } = require('./package.json');
const dotenv = require('dotenv');

const config = {
	mode: process.env.NODE_ENV,
	context: __dirname + "/src",
	entry: {
		'content': "./content.js",
		'background': "./background.js",
		"app/main": "./app/main.js"
	},
	output: {
		path: __dirname + "/dist",
		filename: "[name].js"
	},
	resolve: {
		extensions: [".js", ".vue"]
	},
	module: {
		rules: [
			{
				test: /\.vue$/,
				loaders: "vue-loader"
			},
			{
				test: /\.js$/,
				loader: "babel-loader",
				exclude: /node_modules/
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, "css-loader"]
			},
			{
				test: /\.scss$/,
				use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
			},
			{
				test: /\.sass$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader",
					"sass-loader?indentedSyntax"
				]
			},
			{
				test: /\.(png|jpg|gif|svg|ico)$/,
				loader: "file-loader",
				options: {
					name: "/assets/img/[name].[ext]"
				}
			}
		]
	},
	plugins: [
		...(process.env.NODE_ENV === 'production' ? [new CleanWebpackPlugin()] : []),
		new webpack.DefinePlugin({
			global: "window",
			'process.env': JSON.stringify(dotenv.config().parsed)
		}),
		new VueLoaderPlugin(),
		new MiniCssExtractPlugin({
			filename: "[name].css"
		}),
		new CopyWebpackPlugin([
			{ from: "icons", to: "icons" },
			{
				from: "app/index.html",
				to: "app/index.html",
				transform: transformHtml
			},
			{
				from: "app/popup.html",
				to: "app/popup.html",
				transform: transformHtml
			},
			{
				from: "manifest.json",
				to: "manifest.json",
				transform: content => {
					const jsonContent = JSON.parse(content);
					jsonContent.version = version;

					if (config.mode === "development") {
						jsonContent["content_security_policy"] =
							"script-src 'self' 'unsafe-eval'; object-src 'self'";
					}

					return JSON.stringify(jsonContent, null, 2);
				}
			}
		])
	]
};

if (config.mode === 'production') {
	config.plugins = (config.plugins || []).concat([
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"',
			},
		}),
	]);
}

if (process.env.DEV === 'true') {
	config.plugins = (config.plugins || []).concat([
		new ChromeExtensionReloader(),
	]);
}

function transformHtml(content) {
	return ejs.render(content.toString(), {
		...process.env,
	});
}

module.exports = config;
