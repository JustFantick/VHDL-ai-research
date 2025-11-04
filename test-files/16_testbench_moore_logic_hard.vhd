library ieee;
use ieee.std_logic_1164.all;

entity tb_VHDL_Moore_FSM_Sequence_Detector is
end tb_VHDL_Moore_FSM_Sequence_Detector;

architecture behavior of tb_VHDL_Moore_FSM_Sequence_Detector is
    component VHDL_MOORE_FSM_Sequence_Detector
        port (
            clock : in std_logic;
            reset : in std_logic;
            sequence_in : in std_logic;
            detector_out : out std_logic
        );
    end component;

    signal clock : std_logic := '0';
    signal reset : std_logic := '0';
    signal sequence_in : std_logic := '0';
    signal detector_out : std_logic;

    constant clock_period : time := 10 ns;
begin
    uut : VHDL_MOORE_FSM_Sequence_Detector port map (
        clock => clock,
        reset => reset,
        sequence_in => sequence_in,
        detector_out => detector_out
    );

    clock_process : process
    begin
        clock <= '0';
        wait for clock_period / 2;
        clock <= '1';
        wait for clock_period / 2;
    end process;

    stim_proc : process
    begin
        sequence_in <= '0';
        reset <= '1';
        wait for 30 ns;
        reset <= '0';
        wait for 35 ns;
        sequence_in <= '1';
        wait for 5 ns;
        sequence_in <= '0';
        wait for 5 ns;
        sequence_in <= '1';
        wait for 5 ns;
        sequence_in <= '0';
        wait for 20 ns;
        sequence_in <= '1';
        wait for 20 ns;
        sequence_in <= '0';
        wait;
    end process;
end;