<?php
/**
 * Regression checks for the 1.4.1 fixes (B01–B04 in the 11 Oct 2026 review).
 * Run: php wordpress-plugin/tests/run-tests.php
 *
 * Loads the real plugin file against minimal stand-ins for the WordPress functions it
 * calls. The stand-ins are simplified, so this is not a substitute for a test on a real
 * WordPress install (especially esc_url_raw and get_block_wrapper_attributes).
 */

define( 'ABSPATH', __DIR__ );

// ─── WordPress stand-ins ────────────────────────────────────────────────────────
$GLOBALS['options']  = array();
$GLOBALS['errors']   = array();
$GLOBALS['blocks']   = array();
$GLOBALS['align']    = '';

function add_action() {}
function add_filter() {}
function add_shortcode() {}
function plugin_basename( $f ) { return basename( $f ); }
function __( $s ) { return $s; }
function esc_html__( $s ) { return htmlspecialchars( $s ); }
function esc_attr__( $s ) { return htmlspecialchars( $s, ENT_QUOTES ); }
function esc_html_e( $s ) { echo htmlspecialchars( $s ); }
function esc_attr_e( $s ) { echo htmlspecialchars( $s, ENT_QUOTES ); }
function esc_attr( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_url( $s ) { return htmlspecialchars( esc_url_raw( $s ), ENT_QUOTES ); }
function esc_url_raw( $url, $protocols = array( 'http', 'https' ) ) {
	$scheme = strtolower( (string) parse_url( $url, PHP_URL_SCHEME ) );
	return ( $url && in_array( $scheme, $protocols, true ) && filter_var( $url, FILTER_VALIDATE_URL ) ) ? $url : '';
}
function wp_parse_url( $url ) { return parse_url( $url ); }
function absint( $n ) { return abs( (int) $n ); }
function current_user_can() { return true; }
function wp_enqueue_script() {}
function shortcode_atts( $defaults, $atts ) { return array_merge( $defaults, array_intersect_key( (array) $atts, $defaults ) ); }
function get_option( $name, $default = false ) { return array_key_exists( $name, $GLOBALS['options'] ) ? $GLOBALS['options'][ $name ] : $default; }
function add_settings_error( $setting, $code, $message ) { $GLOBALS['errors'][] = compact( 'setting', 'code', 'message' ); }
function get_settings_errors( $setting ) { return array_values( array_filter( $GLOBALS['errors'], function ( $e ) use ( $setting ) { return $e['setting'] === $setting; } ) ); }
function wp_list_filter( $list, $args ) {
	return array_filter( $list, function ( $item ) use ( $args ) { return ! array_diff_assoc( $args, array_intersect_key( $item, $args ) ); } );
}
function add_query_arg( $key, $value, $url ) {
	list( $base, $q ) = array_pad( explode( '?', $url, 2 ), 2, '' );
	parse_str( $q, $params );
	$params[ $key ] = $value;
	return $base . '?' . http_build_query( $params );
}
function remove_query_arg( $keys, $url ) {
	list( $base, $q ) = array_pad( explode( '?', $url, 2 ), 2, '' );
	parse_str( $q, $params );
	$params = array_diff_key( $params, array_flip( (array) $keys ) );
	return $params ? $base . '?' . http_build_query( $params ) : $base;
}
function register_block_type( $name, $args ) { $GLOBALS['blocks'][ $name ] = $args; }
function get_block_wrapper_attributes( $extra ) {
	$class = 'wp-block-salon-central-booking ' . $extra['class'] . ( $GLOBALS['align'] ? ' align' . $GLOBALS['align'] : '' );
	return 'class="' . esc_attr( $class ) . '"';
}
function wp_register_script() {}
function wp_add_inline_script() {}
function settings_fields() {}
function submit_button() {}
function checked() {}

require dirname( __DIR__ ) . '/salon-central-booking/salon-central-booking.php';

// ─── checks ──────────────────────────────────────────────────────────────────────
$fails = 0;
function check( $label, $ok ) {
	global $fails;
	echo ( $ok ? "  ok    " : "  FAIL  " ) . $label . "\n";
	$fails += $ok ? 0 : 1;
}

$good  = 'https://app.saloncentral.xyz/book/morning-glory';
$other = 'https://app.saloncentral.xyz/book/other-branch';

echo "B01 saving the booking link\n";
$GLOBALS['options'][ SCB_OPTION ] = $good;
check( 'blank removes the saved link', '' === scb_sanitize_url( '' ) );
check( 'whitespace-only counts as blank', '' === scb_sanitize_url( "  \n" ) );
check( 'a different valid link is saved', $other === scb_sanitize_url( $other ) );
$GLOBALS['errors'] = array();
check( 'an invalid link keeps the saved one', $good === scb_sanitize_url( 'https://wrong.example/book/morning-glory' ) );
check( '...and reports an error', 1 === count( get_settings_errors( SCB_OPTION ) ) );
scb_sanitize_url( 'https://wrong.example/book/morning-glory' ); // WordPress's second pass on first save
check( '...only once when sanitised twice', 1 === count( get_settings_errors( SCB_OPTION ) ) );
check( 'http:// is rejected', $good === scb_sanitize_url( 'http://app.saloncentral.xyz/book/morning-glory' ) );
check( 'a port is rejected', $good === scb_sanitize_url( 'https://app.saloncentral.xyz:8443/book/morning-glory' ) );
$GLOBALS['options'][ SCB_OPTION ] = '';
check( 'invalid with nothing saved stays empty', '' === scb_sanitize_url( 'https://wrong.example/' ) );

echo "B02 plugin settings override link parameters\n";
$u = scb_frame_url( $good . '?layout=grid', '', 'list' );
check( 'List removes ?layout=grid from the link', false === strpos( $u, 'layout=' ) );
$u = scb_frame_url( $good . '?accent=ff0000', '', 'list' );
check( 'cleared colour removes ?accent from the link', false === strpos( $u, 'accent=' ) );
$u = scb_frame_url( 'https://app.saloncentral.xyz/online-booking?salon=abc&accent=ff0000&layout=list', '#00aa55', 'grid' );
parse_str( (string) parse_url( $u, PHP_URL_QUERY ), $q );
check( 'chosen colour and Grid replace the link\'s values', '00aa55' === $q['accent'] && 'grid' === $q['layout'] );
check( 'other parameters (salon) are kept', 'abc' === $q['salon'] );
check( 'no duplicate parameters', 1 === substr_count( $u, 'accent=' ) && 1 === substr_count( $u, 'layout=' ) );

echo "B03 block alignment reaches the page\n";
$GLOBALS['options'][ SCB_OPTION ] = $good;
scb_register_block();
$block = $GLOBALS['blocks']['salon-central/booking'];
check( 'server registers wide/full align support', array( 'wide', 'full' ) === $block['supports']['align'] );
$GLOBALS['align'] = 'wide';
$html             = call_user_func( $block['render_callback'], array( 'align' => 'wide' ) );
check( 'block output carries the alignwide class', 1 === preg_match( '/^<div class="[^"]*\bscb-wrap\b[^"]*\balignwide\b/', $html ) );
check( 'block output still renders the form', false !== strpos( $html, 'class="scb-frame"' ) );
check( 'shortcode keeps its plain wrapper', 0 === strpos( scb_shortcode( array() ), '<div class="scb-wrap"><iframe' ) );
check( 'clipboard-write is no longer granted', false === strpos( $html, 'clipboard-write' ) );

echo "B04 settings page previews\n";
$GLOBALS['options'][ SCB_OPTION ] = '';
ob_start();
scb_render_settings_page();
$page = ob_get_clean();
check( 'no saved link: previews hidden', false !== strpos( $page, '<div id="scb-previews" hidden>' ) );
check( 'no saved link: frames have no src (would load wp-admin)', 0 === preg_match( '/class="scb-preview-frame"[^>]*\ssrc=/', $page ) );
$GLOBALS['options'][ SCB_OPTION ] = $good;
ob_start();
scb_render_settings_page();
$page = ob_get_clean();
check( 'saved link: previews shown with the link', false !== strpos( $page, '<div id="scb-previews" >' ) && 2 === substr_count( $page, 'src="' . $good ) );
check( 'previews use the live form\'s sandbox', 2 === substr_count( $page, 'sandbox="' . SCB_SANDBOX . '"' ) );
check( 'inline validation message present', false !== strpos( $page, 'id="scb-url-msg"' ) );

echo "B02/B04 settings page JavaScript\n";
$src = file_get_contents( dirname( __DIR__ ) . '/salon-central-booking/salon-central-booking.php' );
preg_match( "/wp_add_inline_script\(\s*'wp-color-picker',\s*<<<'JS'\n(.*?)\nJS\n/s", $src, $m );
$js = tempnam( sys_get_temp_dir(), 'scb' ) . '.js';
file_put_contents( $js, $m[1] );
passthru( 'node ' . escapeshellarg( __DIR__ . '/admin-preview.test.cjs' ) . ' ' . escapeshellarg( $js ), $code );
unlink( $js );
$fails += $code ? 1 : 0;

echo $fails ? "\n$fails check(s) failed\n" : "\nAll checks passed\n";
exit( $fails ? 1 : 0 );
